import { getBlogPostBySlug, getAllBlogPosts } from '@/lib/blog';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { AuthorBio } from '@/components/ui/AuthorBio';
import { constructMetadata } from '@/lib/seo';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Post not found',
    };
  }

  return constructMetadata({
    title: post.title,
    description: post.excerpt || post.title,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    canonicalUrl: `https://isaacavazquez.com/writing/${params.slug}`,
    aiMetadata: {
      expertise: post.tags || [],
      contentType: "Article",
      profession: "Technical Product Manager",
      summary: post.excerpt,
    },
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <article className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-400 mb-6">
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            {post.readingTime && (
              <>
                <span>•</span>
                <span>{post.readingTime}</span>
              </>
            )}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Article Content */}
        <div
          className="prose prose-neutral dark:prose-invert max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Author Bio - E-E-A-T Signal */}
        <div className="mt-16 mb-12">
          <AuthorBio variant="full" />
        </div>

        {/* Related Posts or Call to Action */}
        <footer className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-700">
          <div className="text-center">
            <p className="text-neutral-700 dark:text-neutral-300 mb-4">
              Interested in learning more about product management or working together?
            </p>
            <a
              href="/contact"
              className="inline-flex items-center px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Get in Touch
            </a>
          </div>
        </footer>
      </article>
    </div>
  );
}