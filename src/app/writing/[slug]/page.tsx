import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { AuthorBio } from "@/components/ui/AuthorBio";
import {
  constructMetadata,
  absoluteUrl,
  fitMetaDescription,
  fitSearchTitle,
  siteConfig,
} from "@/lib/seo";
import { AIStructuredData } from "@/components/AIStructuredData";
import {
  getBlogPostCollectionLabel,
  getBlogTopicPageForPost,
} from "@/lib/blog-config";
import {
  getAllBlogPostPreviews,
  getBlogPostBySlug,
  getRelatedBlogPosts,
} from "@/lib/blog";
import { Catalog97Slot } from "@/components/catalog97/Catalog97Primitives";
import { ArticleCodeCopy } from "@/components/analytics/ArticleCodeCopy";
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
    return { title: "Post not found", robots: { index: false, follow: true } };
  }

  const metadataTitle = fitSearchTitle(post.seo?.title || post.title);
  const metadataDescription = fitMetaDescription(
    post.seo?.description || post.excerpt || post.title
  );

  return constructMetadata({
    title: metadataTitle,
    description: metadataDescription,
    image: `/writing/${slug}/opengraph-image`,
    ogType: "article",
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    articleAuthor: `${siteConfig.url}/about`,
    articleSection: getBlogPostCollectionLabel(post),
    articleTags: post.seo?.keywords || post.tags,
    canonicalUrl: `${siteConfig.url}/writing/${slug}`,
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
  const topicPage = getBlogTopicPageForPost(post);
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Writing", url: "/writing" },
    ...(topicPage
      ? [
          {
            name: topicPage.label,
            url: `/writing/topics/${topicPage.slug}`,
          },
        ]
      : []),
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
              url: `${siteConfig.url}/about`,
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

      {/*
        Hero. Breadcrumb, collection kicker, the title at the display step, the
        byline as a meta row, the excerpt as the standfirst, and the tags as
        chips. The cover is a Catalog 97 slot: the flat stone field stays
        painted under the photograph, and the credit is the slot's caption.
      */}
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
              {topicPage ? (
                <li>
                  <Link
                    href={`/writing/topics/${topicPage.slug}`}
                    className="c97-microlink"
                  >
                    {topicPage.label}
                  </Link>
                </li>
              ) : null}
              <li aria-current="page">
                <span
                  style={{
                    maxWidth: "40ch",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {post.title}
                </span>
              </li>
            </ol>
          </nav>

          <header
            style={{
              marginTop: "var(--c97-sp-4)",
              display: "grid",
              gap: "var(--c97-sp-3)",
            }}
          >
            {topicPage ? (
              <div>
                <Link
                  href={`/writing/topics/${topicPage.slug}`}
                  className="c97-microlink"
                >
                  {getBlogPostCollectionLabel(post)}
                </Link>
              </div>
            ) : (
              <p className="c97-kicker">{getBlogPostCollectionLabel(post)}</p>
            )}

            <h1 className="c97-display">{post.title}</h1>

            <p className="c97-meta">
              <span>Isaac Vazquez</span>
              <time dateTime={post.publishedAt}>
                {publishedDateFormatter.format(new Date(post.publishedAt))}
              </time>
              {post.updatedAt && post.updatedAt !== post.publishedAt ? (
                <span>
                  Updated{" "}
                  <time dateTime={post.updatedAt}>
                    {publishedDateFormatter.format(new Date(post.updatedAt))}
                  </time>
                </span>
              ) : null}
              <span className="c97-tabular">{post.readingTime}</span>
            </p>

            <p
              className="c97-lead"
              style={{
                maxWidth: "var(--c97-column)",
                color: "var(--c97-ink-2)",
              }}
            >
              {post.excerpt}
            </p>

            {post.tags && post.tags.length > 0 ? (
              <ul
                aria-label="Tags"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "var(--c97-sp-1)",
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                }}
              >
                {post.tags.slice(0, 4).map((tag) => (
                  <li key={tag} className="c97-chip">
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}

            {/*
              The hero only renders a real photo. Posts without one keep their
              generated social card for link unfurls, where it belongs; dropped
              into the page it repeated the headline.
            */}
            {post.coverImage && !post.coverImage.endsWith("/opengraph-image") ? (
              <Catalog97Slot
                surface="stone"
                ratio="1200 / 630"
                src={post.coverImage}
                alt={post.coverImageAlt || post.title}
                priority
                sizes="(min-width: 1280px) 1080px, 100vw"
                caption={
                  post.coverImageCredit ? (
                    <>
                      Photo by{" "}
                      {post.coverImageCreditUrl ? (
                        <a
                          href={post.coverImageCreditUrl}
                          className="c97-link"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {post.coverImageCredit}
                        </a>
                      ) : (
                        <span>{post.coverImageCredit}</span>
                      )}
                    </>
                  ) : undefined
                }
                style={{ marginTop: "var(--c97-sp-2)" }}
              />
            ) : null}
          </header>
        </div>
      </section>

      {/* The article itself, in the running-prose column. */}
      <section className="c97-band c97-band-continues" data-c97-surface="paper">
        <div className="c97-shell">
          <div
            id="article-body"
            className="c97-article c97-article-end"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          <ArticleCodeCopy containerSelector="#article-body" location="article" />
        </div>
      </section>

      {/* The post's own call to action, on the saffron field. */}
      {post.cta ? (
        <section className="c97-band" data-c97-surface="ink-saffron">
          <div
            className="c97-shell"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: "var(--c97-sp-4)",
              alignItems: "end",
            }}
          >
            <div>
              <p className="c97-kicker">{post.cta.eyebrow || "Related work"}</p>
              <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-2)" }}>
                {post.cta.title}
              </h2>
              <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)" }}>
                {post.cta.description}
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <Link href={post.cta.href} className="c97-btn c97-btn-invert">
                {post.cta.actionLabel || "Open it"}
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Related writing, as a ledger on bone. */}
      {relatedPosts.length > 0 ? (
        <section
          className="c97-band"
          data-c97-surface="bone"
          aria-labelledby="related-writing-heading"
        >
          <div className="c97-shell">
            <p className="c97-kicker">Related writing</p>
            <h2
              id="related-writing-heading"
              className="c97-serif c97-h2"
              style={{ marginTop: "var(--c97-sp-2)" }}
            >
              If this piece was useful, these should stack on top of it.
            </h2>
            <div style={{ marginTop: "var(--c97-sp-4)" }}>
              {relatedPosts.map((relatedPost) => (
                <article
                  key={relatedPost.slug}
                  className="c97-row c97-row-stack-sm"
                  style={{
                    borderTop: "1px solid var(--c97-rule)",
                    paddingBlock: "var(--c97-sp-3)",
                  }}
                >
                  <div>
                    <p className="c97-kicker">
                      {getBlogPostCollectionLabel(relatedPost)}
                    </p>
                    <h3 className="c97-serif c97-h3" style={{ marginTop: "var(--c97-sp-1)" }}>
                      <Link
                        href={`/writing/${relatedPost.slug}`}
                        style={{ textDecoration: "none" }}
                      >
                        {relatedPost.title}
                      </Link>
                    </h3>
                    <p
                      className="c97-prose"
                      style={{
                        marginTop: "var(--c97-sp-1)",
                        color: "var(--c97-ink-2)",
                      }}
                    >
                      {relatedPost.excerpt}
                    </p>
                  </div>
                  <p className="c97-meta">
                    <span className="c97-tabular">{relatedPost.readingTime}</span>
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Author, the older and newer neighbours, and the way back. */}
      <section className="c97-band" data-c97-surface="paper">
        <div className="c97-shell" style={{ display: "grid", gap: "var(--c97-sp-5)" }}>
          <AuthorBio variant="light" />

          {olderPost || newerPost ? (
            <nav
              aria-label="Article pagination"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
                gap: "var(--c97-sp-3)",
                borderTop: "1px solid var(--c97-rule)",
                paddingTop: "var(--c97-sp-4)",
              }}
            >
              {olderPost ? (
                <Link
                  href={`/writing/${olderPost.slug}`}
                  rel="prev"
                  style={{
                    display: "grid",
                    gap: "var(--c97-sp-1)",
                    alignContent: "start",
                    minHeight: 44,
                    textDecoration: "none",
                  }}
                >
                  <span className="c97-kicker">Previous</span>
                  <span className="c97-serif c97-h3">{olderPost.title}</span>
                </Link>
              ) : (
                <span aria-hidden="true" />
              )}
              {newerPost ? (
                <Link
                  href={`/writing/${newerPost.slug}`}
                  rel="next"
                  style={{
                    display: "grid",
                    gap: "var(--c97-sp-1)",
                    alignContent: "start",
                    minHeight: 44,
                    textDecoration: "none",
                    textAlign: "right",
                  }}
                >
                  <span className="c97-kicker">Next</span>
                  <span className="c97-serif c97-h3">{newerPost.title}</span>
                </Link>
              ) : (
                <span aria-hidden="true" />
              )}
            </nav>
          ) : null}

          <div>
            <Link href="/writing" className="c97-sectionlink">
              Back to writing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
