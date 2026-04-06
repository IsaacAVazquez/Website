import { getAllBlogPosts } from "@/lib/blog";
import { StructuredData } from "@/components/StructuredData";
import { generateBreadcrumbStructuredData, constructMetadata } from "@/lib/seo";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import Link from "next/link";
import { Calendar, Clock, ArrowRight } from "@/components/ui/ServerIcons";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { publishedDateFormatter } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Writing",
  description:
    "Writing on product strategy, analytics-heavy decision making, technical product work, and lessons from building systems that need trust as much as speed.",
  canonicalUrl: "/writing",
  dateModified: "2025-02-05",
  aiMetadata: {
    expertise: [
      "Product Management",
      "Product Strategy",
      "Technical Product Management",
      "Data-Driven Decisions",
      "User Research",
      "Career Transition",
      "Quality Engineering",
      "Consumer Technology",
    ],
    contentType: "Blog",
    profession: "Technical Product Manager",
    industry: ["Technology", "SaaS", "Consumer Technology"],
    topics: ["Product Management", "Strategy", "Career Development", "Engineering"],
    context:
      "Technical articles and insights from UC Berkeley Haas MBA Candidate with 6+ years in product and engineering",
    primaryFocus: "Product Management Strategy and Career Insights",
  },
});

export default async function WritingPage() {
  const posts = await getAllBlogPosts();

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Writing", url: "/writing" },
  ];

  const articlesStructuredData = posts.slice(0, 10).map((post) => ({
    headline: post.title,
    description: post.excerpt,
    author: {
      name: post.author || "Isaac Vazquez",
      url: "https://isaacavazquez.com",
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    keywords: post.tags,
    articleSection: post.category,
    wordCount: Math.ceil(post.content.length / 6),
    url: `https://isaacavazquez.com/writing/${post.slug}`,
  }));

  return (
    <>
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (generateBreadcrumbStructuredData(breadcrumbs) as {
            itemListElement: object[];
          }).itemListElement,
        }}
      />

      {articlesStructuredData.map((article, index) => (
        <StructuredData key={index} type="Article" data={article} />
      ))}

      <div className="min-h-screen bg-[var(--surface-primary)] page-section">
        <div className="page-shell-tight">
          <SectionIntro
            eyebrow="Writing"
            size="md"
            headingLevel={1}
            title="Notes on product strategy, operating systems, and analytics-heavy work."
            description="This is where I unpack the decisions behind the portfolio. Product thinking, technical judgment, and lessons from building systems where trust matters."
            actions={
              <ModernButton href="/portfolio" variant="outline" size="md">
                View projects
              </ModernButton>
            }
          />

          {posts.length > 0 ? (
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/writing/${post.slug}`}
                  className="group block h-full"
                >
                  <WarmCard hover padding="lg" className="flex h-full flex-col overflow-hidden">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      {post.category ? (
                        <span className="section-kicker">{post.category}</span>
                      ) : (
                        <span />
                      )}
                      <time
                        dateTime={post.publishedAt}
                        className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-tertiary)]"
                      >
                        {publishedDateFormatter.format(new Date(post.publishedAt))}
                      </time>
                    </div>

                    <h2 className="mb-3 text-xl font-bold text-[var(--text-primary)] transition-colors group-hover:text-[var(--color-primary)] md:text-2xl">
                      {post.title}
                    </h2>

                    {post.excerpt ? (
                      <p className="mb-5 flex-grow text-base leading-relaxed text-[var(--text-secondary)] line-clamp-4">
                        {post.excerpt}
                      </p>
                    ) : null}

                    <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-[var(--border-primary)] pt-4 text-sm text-[var(--text-secondary)]">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{publishedDateFormatter.format(new Date(post.publishedAt))}</span>
                      </div>
                      {post.readingTime ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{post.readingTime}</span>
                        </div>
                      ) : null}
                      <div className="ml-auto">
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>

                    {post.tags && post.tags.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-[var(--text-tertiary)]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </WarmCard>
                </Link>
              ))}
            </div>
          ) : (
            <WarmCard padding="xl" className="mt-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-[var(--text-primary)]">
                Articles Coming Soon
              </h2>
              <p className="mx-auto max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">
                I'm working on more pieces about product thinking, analytics, and the decisions behind the tools I build.
              </p>
            </WarmCard>
          )}
        </div>
      </div>
    </>
  );
}
