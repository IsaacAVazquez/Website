import { getBlogPostBySlug, getAllBlogPosts } from '@/lib/blog';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { AuthorBio } from '@/components/ui/AuthorBio';
import { constructMetadata, calculateReadingTime } from '@/lib/seo';
import { AIStructuredData } from '@/components/AIStructuredData';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return { title: 'Post not found' };
  }

  const metadataTitle = post.seo?.title || post.title;
  const metadataDescription = post.seo?.description || post.excerpt || post.title;

  return constructMetadata({
    title: metadataTitle,
    description: metadataDescription,
    ogType: "article",
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    articleAuthor: "https://isaacavazquez.com/about",
    articleSection: Array.isArray(post.tags) && post.tags[0] ? post.tags[0] : "Product Management",
    articleTags: post.seo?.keywords || post.tags,
    canonicalUrl: `https://isaacavazquez.com/writing/${slug}`,
    aiMetadata: {
      expertise: post.seo?.keywords || post.tags || [],
      contentType: "Article",
      profession: "Technical Product Manager",
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

  const readingTime = post.readingTime || `${calculateReadingTime(post.content)} min read`;
  const wordCount = post.content.split(/\s+/).length;

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
              jobTitle: "Technical Product Manager & UC Berkeley MBA Candidate",
              url: "https://isaacavazquez.com",
            },
            datePublished: post.publishedAt,
            dateModified: post.updatedAt || post.publishedAt,
            url: `https://isaacavazquez.com/writing/${slug}`,
            keywords: Array.isArray(articleKeywords) ? articleKeywords.join(", ") : (articleKeywords || ""),
            wordCount: wordCount,
            readingTime: readingTime,
            image: "https://isaacavazquez.com/og-image.png",
            inLanguage: "en-US",
            isAccessibleForFree: true,
            articleSection: Array.isArray(post.tags) && post.tags[0] ? post.tags[0] : "Product Management",
          },
        }}
      />

      <section className="home-page min-h-screen">
        <div className="home-shell home-section">
          <article className="max-w-6xl mx-auto">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-8">
              <ol
                className="flex items-center gap-2 text-sm"
                style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
              >
                <li>
                  <a
                    href="/writing"
                    className="transition-colors hover:text-[var(--home-ink)]"
                    style={{ color: "var(--home-ink-muted)" }}
                  >
                    Writing
                  </a>
                </li>
                <li aria-hidden="true">/</li>
                <li className="truncate max-w-[40ch]" style={{ color: "var(--home-ink)" }}>
                  {post.title}
                </li>
              </ol>
            </nav>

            {/* Article header */}
            <header className="mb-10">
              {post.tags && post.tags[0] && (
                <span className="home-kicker mb-4 inline-block">{post.tags[0]}</span>
              )}

              <h1
                className="mb-4 max-w-5xl"
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
                className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-5"
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
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                <span aria-hidden="true">·</span>
                <span>{readingTime}</span>
              </div>

              {post.tags && post.tags.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.slice(1).map((tag) => (
                    <span key={tag} className="resume-chip">{tag}</span>
                  ))}
                </div>
              )}

              <hr style={{ borderColor: "var(--home-rule)", marginTop: "1.5rem" }} />
            </header>

            {/* Article body */}
            <div
              className="prose prose-home dark:prose-invert max-w-none mb-16"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Author bio */}
            <div className="mb-10" style={{ borderTop: "1px solid var(--home-rule)", paddingTop: "2.5rem" }}>
              <AuthorBio variant="full" />
            </div>

            {/* Back link */}
            <div className="pb-8">
              <a href="/writing" className="home-inline-link">
                &larr; Back to writing
              </a>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
