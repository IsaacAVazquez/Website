import { getAllBlogPosts } from '@/lib/blog';
import { StructuredData } from "@/components/StructuredData";
import { generateBreadcrumbStructuredData, constructMetadata } from "@/lib/seo";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { WarmCard } from "@/components/ui/WarmCard";
import Link from "next/link";
import { IconCalendar, IconClock, IconArrowRight } from "@tabler/icons-react";

export const metadata = constructMetadata({
  title: 'Writing - Product Management Insights & Technical Articles | Isaac Vazquez',
  description: 'Articles on product management, product strategy, transitioning from engineering to product roles, data-driven decision making, and building mission-driven products. Written by Isaac Vazquez, Technical Product Manager and UC Berkeley Haas MBA Candidate.',
  canonicalUrl: 'https://isaacavazquez.com/writing',
  aiMetadata: {
    expertise: [
      'Product Management',
      'Product Strategy',
      'Technical Product Management',
      'Data-Driven Decisions',
      'User Research',
      'Career Transition',
      'Quality Engineering',
      'Civic Technology',
    ],
    contentType: 'Blog',
    profession: 'Technical Product Manager',
    industry: ['Technology', 'SaaS', 'Civic Tech'],
    topics: ['Product Management', 'Strategy', 'Career Development', 'Engineering'],
    context: 'Technical articles and insights from UC Berkeley Haas MBA Candidate with 6+ years in product and engineering',
    primaryFocus: 'Product Management Strategy and Career Insights',
  },
});

export default async function WritingPage() {
  const posts = await getAllBlogPosts();

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Writing", url: "/writing" }
  ];

  // Create structured data for the articles
  const articlesStructuredData = posts.slice(0, 10).map(post => ({
    headline: post.title,
    description: post.excerpt,
    author: {
      name: post.author || 'Isaac Vazquez',
      url: 'https://isaacavazquez.com'
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    keywords: post.tags,
    articleSection: post.category,
    wordCount: Math.ceil(post.content.length / 6), // Rough word count estimate
    url: `https://isaacavazquez.com/writing/${post.slug}`
  }));

  return (
    <>
      {/* Breadcrumb Structured Data */}
      <StructuredData
        type="BreadcrumbList"
        data={{ items: (generateBreadcrumbStructuredData(breadcrumbs) as any).itemListElement }}
      />

      {/* Articles Structured Data */}
      {articlesStructuredData.map((article, index) => (
        <StructuredData
          key={index}
          type="Article"
          data={article}
        />
      ))}

      <div className="min-h-screen py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <Heading level={1} className="text-4xl md:text-5xl lg:text-6xl mb-4">
              <span className="gradient-text-warm">Writing</span>
            </Heading>
            <Paragraph size="lg" className="text-[#4A3426] dark:text-[#D4A88E] max-w-3xl">
              Insights on product management, technical leadership, and building mission-driven products.
              Perspectives from a Technical PM at UC Berkeley Haas.
            </Paragraph>
          </div>

          {/* Posts Grid */}
          {posts.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/writing/${post.slug}`}
                  className="group"
                >
                  <WarmCard hover={true} padding="lg" className="h-full flex flex-col">
                    {/* Category Badge */}
                    {post.category && (
                      <div className="mb-3">
                        <span className="inline-block px-3 py-1 text-xs font-medium bg-[#FF6B35]/10 text-[#FF6B35] dark:bg-[#FF8E53]/20 dark:text-[#FF8E53] rounded-full">
                          {post.category}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3 group-hover:text-[#FF6B35] dark:group-hover:text-[#FF8E53] transition-colors">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-base text-neutral-700 dark:text-neutral-300 mb-4 line-clamp-3 flex-grow">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400 mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center gap-1">
                        <IconCalendar className="w-4 h-4" />
                        <time dateTime={post.publishedAt}>
                          {new Date(post.publishedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </time>
                      </div>
                      {post.readingTime && (
                        <div className="flex items-center gap-1">
                          <IconClock className="w-4 h-4" />
                          <span>{post.readingTime}</span>
                        </div>
                      )}
                      <div className="ml-auto">
                        <IconArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-neutral-600 dark:text-neutral-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </WarmCard>
                </Link>
              ))}
            </div>
          ) : (
            <WarmCard padding="xl" className="text-center">
              <Heading level={2} className="text-[#FF6B35] mb-4">
                Articles Coming Soon
              </Heading>
              <Paragraph>
                Check back soon for insights on product management, technical leadership,
                and building impactful products.
              </Paragraph>
            </WarmCard>
          )}
        </div>
      </div>
    </>
  );
}