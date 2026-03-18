import { getAllBlogPosts } from '@/lib/blog';
import { StructuredData } from "@/components/StructuredData";
import { generateBreadcrumbStructuredData, constructMetadata } from "@/lib/seo";
import { WarmCard } from "@/components/ui/WarmCard";
import Link from "next/link";
import { Calendar, Clock, ArrowRight } from "@/components/ui/ServerIcons";
import { SectionIntro } from "@/components/ui/SectionIntro";

export const metadata = constructMetadata({
  title: 'Writing - Product Management Insights & Technical Articles | Isaac Vazquez',
  description: 'Writing on product strategy, analytics-heavy decision making, technical product work, and lessons from building systems that need trust as much as speed.',
  canonicalUrl: 'https://isaacavazquez.com/writing',
  dateModified: '2025-02-05',
  aiMetadata: {
    expertise: [
      'Product Management',
      'Product Strategy',
      'Technical Product Management',
      'Data-Driven Decisions',
      'User Research',
      'Career Transition',
      'Quality Engineering',
      'Consumer Technology',
    ],
    contentType: 'Blog',
    profession: 'Technical Product Manager',
    industry: ['Technology', 'SaaS', 'Consumer Technology'],
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
    wordCount: Math.ceil(post.content.length / 6),
    url: `https://isaacavazquez.com/writing/${post.slug}`
  }));

  return (
    <>
      {/* Breadcrumb Structured Data */}
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (generateBreadcrumbStructuredData(breadcrumbs) as {
            itemListElement: object[]
          }).itemListElement
        }}
      />

      {/* Articles Structured Data */}
      {articlesStructuredData.map((article, index) => (
        <StructuredData
          key={index}
          type="Article"
          data={article}
        />
      ))}

      <div className="min-h-screen bg-[var(--surface-primary)] page-section">
        <div className="page-shell-tight">
          <SectionIntro
            eyebrow="Writing"
            size="lg"
            title="Notes on product strategy, operating systems, and analytics-heavy work."
            description="This is where I unpack the decisions behind the portfolio: product thinking, technical judgment, and lessons from building systems where trust matters."
          />

          {/* Posts Grid */}
          {posts.length > 0 ? (
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-2">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/writing/${post.slug}`}
                  className="group"
                >
                  <WarmCard hover={true} padding="lg" className="flex h-full flex-col shadow-sm">
                    {/* Category Badge */}
                    {post.category && (
                      <div className="mb-3">
                        <span className="section-kicker">
                          {post.category}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3 group-hover:text-[var(--color-primary)] transition-colors">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-base text-neutral-700 dark:text-neutral-300 mb-4 line-clamp-3 flex-grow">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Meta Info */}
                    <div className="mt-auto flex items-center gap-4 border-t border-neutral-200 pt-4 text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
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
                          <Clock className="w-4 h-4" />
                          <span>{post.readingTime}</span>
                        </div>
                      )}
                      <div className="ml-auto">
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
            <WarmCard padding="xl" className="mt-12 text-center shadow-sm">
              <h2 className="mb-4 text-3xl font-bold text-[var(--text-primary)]">
                Articles Coming Soon
              </h2>
              <p className="mx-auto max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">
                More essays are on the way around product strategy, technical
                leadership, and how to build products that help people make clearer decisions.
              </p>
            </WarmCard>
          )}
        </div>
      </div>
    </>
  );
}
