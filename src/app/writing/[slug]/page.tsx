import { getBlogPostBySlug, getAllBlogPosts } from '@/lib/blog';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

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

  return {
    title: `${post.title} - Isaac Vazquez`,
    description: post.excerpt,
    keywords: post.seo?.keywords,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article>
      <header>
        <h1>{post.title}</h1>
        <div className="post-meta">
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
          <span className="reading-time">{post.readingTime}</span>
        </div>
      </header>

      <div 
        className="prose"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <footer className="post-footer">
        <div className="post-tags">
          {post.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </footer>
    </article>
  );
}