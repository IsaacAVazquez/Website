import { Metadata } from "next";
import { Suspense } from "react";
import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { MorphButton } from "@/components/ui/MorphButton";
import Link from "next/link";
import { getAllBlogPosts, getAllCategories, getAllTags, getBlogPostsByCategory, searchBlogPosts, BlogPost } from "@/lib/blog";
import { BlogFilter } from "@/components/blog/BlogFilter";

export const metadata: Metadata = constructMetadata({
  title: "Blog - QA Engineering & Fantasy Football Analytics",
  description: "Product management insights, fantasy football analytics, and technical leadership content by Isaac Vazquez. Real-world product development and strategy experience.",
  canonicalUrl: "https://isaacavazquez.com/blog",
});

interface BlogPageProps {
  searchParams: {
    category?: string;
    tag?: string;
    q?: string;
  };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { category, tag, q } = searchParams;
  
  // Get all posts and filter based on search params
  let posts = await getAllBlogPosts();
  
  if (category) {
    posts = await getBlogPostsByCategory(category);
  } else if (q) {
    posts = await searchBlogPosts(q);
  }
  
  if (tag) {
    posts = posts.filter(post => 
      post.tags.some(postTag => postTag.toLowerCase() === tag.toLowerCase())
    );
  }
  
  const featuredPosts = posts.filter(post => post.featured);
  const recentPosts = posts.slice(0, 12);
  
  // Get filter options
  const categories = await getAllCategories();
  const tags = await getAllTags();

  return (
    <>
      <StructuredData 
        type="WebPage" 
        data={{
          title: "Blog - QA Engineering & Fantasy Football Analytics",
          description: "Technical insights and tutorials on QA engineering, fantasy football analytics, and software development",
          url: "https://isaacavazquez.com/blog",
          datePublished: "2025-01-24T00:00:00.000Z",
          dateModified: new Date().toISOString(),
        }}
      />
      
      <div className="min-h-screen py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <Heading level={1} className="mb-4">
              Technical Insights &{" "}
              <span className="bg-gradient-to-r from-electric-blue via-matrix-green to-cyber-teal bg-clip-text text-transparent">
                Deep Dives
              </span>
            </Heading>
            <Paragraph size="lg" className="max-w-2xl mx-auto text-slate-600 dark:text-slate-400">
              Explore product management best practices, fantasy football analytics, and technical leadership insights.
            </Paragraph>
            <Paragraph className="max-w-2xl mx-auto text-slate-600 dark:text-slate-400 mt-4">
              Learn from real-world experience in product development, user research, and data-driven decision making.
            </Paragraph>
            
            {/* Filter Status */}
            {(category || tag || q) && (
              <div className="mt-6">
                <Paragraph className="text-slate-600 dark:text-slate-400">
                  {q && `Search results for "${q}"`}
                  {category && `Category: ${category}`}
                  {tag && `Tag: ${tag}`}
                  {" "}({posts.length} {posts.length === 1 ? 'article' : 'articles'})
                </Paragraph>
                <MorphButton href="/blog" variant="ghost" size="sm" className="mt-2">
                  Clear filters
                </MorphButton>
              </div>
            )}
          </div>

          {/* Search and Filter Controls */}
          <Suspense fallback={<div>Loading filters...</div>}>
            <BlogFilter categories={categories} tags={tags} currentCategory={category} currentTag={tag} currentQuery={q} />
          </Suspense>

          {/* Featured Posts */}
          {featuredPosts.length > 0 && (
            <section className="mb-16">
              <Heading level={2} className="mb-8 text-center">
                Featured Articles
              </Heading>
              <div className="grid gap-8 md:grid-cols-2">
                {featuredPosts.slice(0, 2).map((post) => (
                  <FeaturedPostCard key={post.slug} post={post} />
                ))}
              </div>
            </section>
          )}

          {/* All Posts */}
          <section>
            <Heading level={2} className="mb-8">
              All Articles
            </Heading>
            {posts.length === 0 ? (
              <GlassCard className="text-center py-12">
                <Heading level={3} className="mb-4">
                  Coming Soon
                </Heading>
                <Paragraph className="text-slate-600 dark:text-slate-400 mb-6">
                  I'm working on exciting content covering:
                </Paragraph>
                <ul className="list-disc ml-6 space-y-2 text-slate-600 dark:text-slate-400 mb-6">
                  <li>Product management frameworks and strategies</li>
                  <li>Technical product leadership insights</li>
                  <li>Fantasy football analytics and data science</li>
                  <li>MBA learnings applied to product development</li>
                </ul>
                <Paragraph className="text-slate-600 dark:text-slate-400 mb-6">
                  Check back soon for updates!
                </Paragraph>
                <MorphButton href="/about" variant="primary">
                  Learn More About Me
                </MorphButton>
              </GlassCard>
            ) : (
              <div className="grid gap-6">
                {recentPosts.map((post) => (
                  <BlogPostCard key={post.slug} post={post} />
                ))}
              </div>
            )}
          </section>

          {/* Categories */}
          <section className="mt-16">
            <Heading level={2} className="mb-8 text-center">
              Topics I Write About
            </Heading>
            <div className="grid gap-6 md:grid-cols-3">
              <CategoryCard
                title="Product Management"
                description="Product strategy, user research, and technical PM frameworks"
                badge="Strategy"
                href="/blog?category=product-management"
              />
              <CategoryCard
                title="Fantasy Football Analytics"
                description="Data visualization, player analysis, and fantasy sports algorithms"
                badge="Analytics"
                href="/blog?category=fantasy-football"
              />
              <CategoryCard
                title="Software Development"
                description="TypeScript, React, Next.js, and performant web applications"
                badge="Development"
                href="/blog?category=software-development"
              />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

interface FeaturedPostCardProps {
  post: BlogPost;
}

function FeaturedPostCard({ post }: FeaturedPostCardProps) {
  return (
    <GlassCard interactive className="overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="electric">{post.category}</Badge>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {new Date(post.publishedAt).toLocaleDateString()}
          </span>
        </div>
        <Heading level={3} className="mb-3 line-clamp-2">
          <Link 
            href={`/blog/${post.slug}`}
            className="hover:text-electric-blue transition-colors"
          >
            {post.title}
          </Link>
        </Heading>
        <Paragraph className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
          {post.excerpt}
        </Paragraph>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {post.readingTime}
          </span>
          <MorphButton href={`/blog/${post.slug}`} variant="outline" size="sm">
            Read More
          </MorphButton>
        </div>
      </div>
    </GlassCard>
  );
}

interface BlogPostCardProps {
  post: BlogPost;
}

function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <GlassCard interactive className="overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <Badge variant={post.category === 'QA Engineering' ? 'matrix' : 'electric'}>
            {post.category}
          </Badge>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {new Date(post.publishedAt).toLocaleDateString()}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {post.readingTime}
          </span>
        </div>
        <Heading level={3} className="mb-2">
          <Link 
            href={`/blog/${post.slug}`}
            className="hover:text-electric-blue transition-colors"
          >
            {post.title}
          </Link>
        </Heading>
        <Paragraph className="text-slate-600 dark:text-slate-400 line-clamp-2">
          {post.excerpt}
        </Paragraph>
      </div>
    </GlassCard>
  );
}

interface CategoryCardProps {
  title: string;
  description: string;
  badge: string;
  href: string;
}

function CategoryCard({ title, description, badge, href }: CategoryCardProps) {
  return (
    <GlassCard interactive className="text-center p-6">
      <Badge variant="outline" className="mb-4">
        {badge}
      </Badge>
      <Heading level={3} className="mb-3">
        {title}
      </Heading>
      <Paragraph className="text-slate-600 dark:text-slate-400 text-sm mb-4">
        {description}
      </Paragraph>
      <MorphButton href={href} variant="ghost" size="sm">
        Explore Topics
      </MorphButton>
    </GlassCard>
  );
}