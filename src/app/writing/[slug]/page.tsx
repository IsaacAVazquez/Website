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
    return {
      title: 'Post not found',
    };
  }

  const metadataTitle = post.seo?.title || post.title;
  const metadataDescription = post.seo?.description || post.excerpt || post.title;

  return constructMetadata({
    title: metadataTitle,
    description: metadataDescription,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
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

  // Calculate reading time if not provided
  const readingTime = post.readingTime || `${calculateReadingTime(post.content)} min read`;
  const wordCount = post.content.split(/\s+/).length;

  // Breadcrumbs
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Writing", url: "/writing" },
    { name: post.title, url: `/writing/${slug}` }
  ];

  const articleDescription = post.seo?.description || post.excerpt || post.title;
  const articleKeywords = post.seo?.keywords || post.tags;

  return (
    <>
      {/* Breadcrumb Structured Data */}
      <AIStructuredData
        schema={{
          type: "Breadcrumb",
          data: { items: breadcrumbs },
        }}
      />

      {/* Enhanced Article Structured Data */}
      <AIStructuredData
        schema={{
          type: "Article",
          data: {
            headline: post.title,
            description: articleDescription,
            author: {
              name: "Isaac Vazquez",
              jobTitle: "Technical Product Manager & UC Berkeley MBA Candidate",
              url: "https://isaacavazquez.com"
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

      <div className="min-h-screen bg-[var(--surface-primary)] page-section">
        <div className="page-shell-tight">
          <article>
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-8">
              <ol className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                <li><a href="/writing" className="hover:text-[var(--color-primary)] transition-colors">Writing</a></li>
                <li aria-hidden="true">/</li>
                <li className="text-[var(--text-secondary)] truncate max-w-[40ch]">{post.title}</li>
              </ol>
            </nav>

            <header className="mb-10">
              {post.tags && post.tags[0] && (
                <span className="section-kicker mb-4 inline-block">{post.tags[0]}</span>
              )}
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4 max-w-3xl">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-tertiary)]">
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                <span>•</span>
                <span>{readingTime}</span>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 1 && (
                <div className="flex flex-wrap gap-2 mt-5">
                  {post.tags.slice(1).map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 text-xs font-medium bg-[var(--surface-secondary)] text-[var(--text-tertiary)] rounded-full border border-[var(--border-secondary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <hr className="mt-8 border-[var(--border-primary)]" />
            </header>

            {/* Article Content */}
            <div
              className="prose prose-writing dark:prose-invert max-w-prose mb-16"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Author Bio */}
            <div className="border-t border-[var(--border-primary)] pt-10 mb-10">
              <AuthorBio variant="full" />
            </div>

            {/* Back link */}
            <div className="pb-8">
              <a
                href="/writing"
                className="text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--color-primary)] transition-colors"
              >
                &larr; Back to writing
              </a>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
