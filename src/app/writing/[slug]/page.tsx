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

      <div className="min-h-screen bg-[var(--surface-primary)] py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <article className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-[var(--text-secondary)] mb-6">
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            <>
              <span>•</span>
              <span>{readingTime}</span>
              <span>•</span>
              <span>{wordCount} words</span>
            </>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm font-medium bg-[var(--surface-secondary)] text-[var(--text-secondary)] rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Article Content */}
        <div
          className="prose prose-writing dark:prose-invert max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Author Bio - E-E-A-T Signal */}
        <div className="mt-16 mb-12">
          <AuthorBio variant="full" />
        </div>
      </article>
    </div>
    </>
  );
}
