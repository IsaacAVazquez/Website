import { Metadata } from "next";
import { notFound } from "next/navigation";
import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { MorphButton } from "@/components/ui/MorphButton";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import Link from "next/link";
import { getBlogPostBySlug, getAllBlogPosts, getRelatedBlogPosts } from "@/lib/blog";

interface BlogPostPageProps {
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

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);
  
  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const seoTitle = post.seo?.title || post.title;
  const seoDescription = post.seo?.description || post.excerpt;
  const seoKeywords = post.seo?.keywords || post.tags;

  return constructMetadata({
    title: seoTitle,
    description: seoDescription,
    canonicalUrl: `https://isaacavazquez.com/blog/${params.slug}`,
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getBlogPostBySlug(params.slug);
  
  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedBlogPosts(params.slug, 3);

  const articleData = {
    "@context": "https://schema.org",
    "@type": post.category === "QA Engineering" ? "TechnicalArticle" : "Article",
    "headline": post.title,
    "description": post.excerpt,
    "image": "https://isaacavazquez.com/og-image.png",
    "datePublished": post.publishedAt,
    "dateModified": post.updatedAt || post.publishedAt,
    "author": {
      "@type": "Person",
      "name": post.author,
      "url": "https://isaacavazquez.com",
    },
    "publisher": {
      "@type": "Person",
      "name": "Isaac Vazquez",
      "url": "https://isaacavazquez.com",
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://isaacavazquez.com/blog/${params.slug}`,
    },
    "keywords": post.tags.join(", "),
    "articleSection": post.category,
    "wordCount": post.content.split(/\s+/).length,
    "timeRequired": post.readingTime,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleData),
        }}
      />
      
      <div className="min-h-screen py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-6">
          {/* Breadcrumb */}
          <Breadcrumbs className="mb-8" />

          {/* Article Header */}
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant={post.category === 'QA Engineering' ? 'matrix' : 'electric'}>
                {post.category}
              </Badge>
              <time 
                dateTime={post.publishedAt}
                className="text-sm text-slate-500 dark:text-slate-400"
              >
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {post.readingTime}
              </span>
            </div>
            
            <Heading level={1} className="mb-4">
              {post.title}
            </Heading>
            
            <Paragraph size="lg" className="text-slate-600 dark:text-slate-400 mb-6">
              {post.excerpt}
            </Paragraph>

            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          {/* Article Content */}
          <article className="prose prose-slate dark:prose-invert prose-lg max-w-none">
            <GlassCard className="p-8 md:p-12">
              <div 
                dangerouslySetInnerHTML={{ __html: post.content }}
                className="prose prose-slate dark:prose-invert prose-lg max-w-none
                           prose-headings:font-orbitron prose-headings:font-semibold
                           prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                           prose-p:text-slate-700 dark:prose-p:text-slate-300
                           prose-a:text-electric-blue prose-a:no-underline hover:prose-a:underline
                           prose-code:text-matrix-green prose-code:bg-slate-100 dark:prose-code:bg-slate-800
                           prose-pre:bg-terminal-bg prose-pre:border prose-pre:border-terminal-border
                           prose-blockquote:border-l-electric-blue prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-slate-800/50
                           prose-img:rounded-lg prose-img:shadow-lg"
              />
            </GlassCard>
          </article>

          {/* Article Footer */}
          <footer className="mt-12">
            <GlassCard className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <Paragraph className="text-sm text-slate-600 dark:text-slate-400">
                    Published by {post.author} on{" "}
                    <time dateTime={post.publishedAt}>
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </time>
                    {post.updatedAt && post.updatedAt !== post.publishedAt && (
                      <>
                        {" "}• Updated on{" "}
                        <time dateTime={post.updatedAt}>
                          {new Date(post.updatedAt).toLocaleDateString()}
                        </time>
                      </>
                    )}
                  </Paragraph>
                </div>
                <div className="flex gap-3">
                  <MorphButton href="/blog" variant="outline" size="sm">
                    ← Back to Blog
                  </MorphButton>
                  <MorphButton href="/contact" variant="primary" size="sm">
                    Get in Touch
                  </MorphButton>
                </div>
              </div>
            </GlassCard>
          </footer>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="mt-16">
              <Heading level={2} className="mb-8">
                Related Articles
              </Heading>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((relatedPost) => (
                  <RelatedPostCard key={relatedPost.slug} post={relatedPost} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

interface RelatedPostCardProps {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    publishedAt: string;
    readingTime: string;
  };
}

function RelatedPostCard({ post }: RelatedPostCardProps) {
  return (
    <GlassCard className="p-6 hover:scale-[1.02] transition-transform duration-300">
      <Badge variant="outline" className="mb-3">
        {post.category}
      </Badge>
      <Heading level={3} className="mb-2 text-lg">
        <Link 
          href={`/blog/${post.slug}`}
          className="hover:text-electric-blue transition-colors"
        >
          {post.title}
        </Link>
      </Heading>
      <Paragraph className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
        {post.excerpt}
      </Paragraph>
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
        <span>{post.readingTime}</span>
      </div>
    </GlassCard>
  );
}