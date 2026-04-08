import { getAllBlogPosts } from "@/lib/blog";
import { StructuredData } from "@/components/StructuredData";
import { generateBreadcrumbStructuredData, constructMetadata } from "@/lib/seo";
import Link from "next/link";
import { Clock, ArrowRight } from "@/components/ui/ServerIcons";
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

      <section className="home-page min-h-screen">
        <div className="home-shell home-section space-y-10">
          {/* Page heading */}
          <div className="text-center space-y-3 pt-4">
            <p className="home-kicker">Writing</p>
            <h1
              className="mx-auto w-full max-w-5xl text-center"
              style={{
                fontFamily: "var(--font-home-sans)",
                fontSize: "clamp(2.6rem, 6vw, 5rem)",
                fontWeight: 600,
                lineHeight: 0.94,
                letterSpacing: "-0.07em",
                color: "var(--home-ink)",
              }}
            >
              I write to think through ideas, not to summarize them.
            </h1>
          </div>

          {/* Intro + posts */}
          <div className="space-y-8">
            <p className="home-body" style={{ maxWidth: "48rem" }}>
            </p>

            {posts.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {posts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/writing/${post.slug}`}
                    className="group block h-full"
                  >
                    <div
                      className="home-card h-full flex flex-col"
                      style={{ padding: "1.5rem" }}
                    >
                      {/* Category + date */}
                      <div className="mb-4 flex items-center justify-between gap-3">
                        {post.category ? (
                          <span className="home-kicker">{post.category}</span>
                        ) : (
                          <span />
                        )}
                        <time
                          dateTime={post.publishedAt}
                          style={{
                            fontFamily: "var(--font-home-sans)",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "var(--home-ink-muted)",
                          }}
                        >
                          {publishedDateFormatter.format(new Date(post.publishedAt))}
                        </time>
                      </div>

                      {/* Title */}
                      <h2
                        className="mb-3 transition-colors group-hover:opacity-70"
                        style={{
                          fontFamily: "var(--font-home-sans)",
                          fontSize: "1.15rem",
                          fontWeight: 700,
                          letterSpacing: "-0.03em",
                          lineHeight: 1.2,
                          color: "var(--home-ink)",
                        }}
                      >
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      {post.excerpt ? (
                        <p
                          className="mb-5 flex-grow text-sm leading-relaxed line-clamp-4"
                          style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
                        >
                          {post.excerpt}
                        </p>
                      ) : null}

                      {/* Footer row */}
                      <div
                        className="mt-auto flex items-center justify-between gap-4 pt-4"
                        style={{ borderTop: "1px solid var(--home-rule)" }}
                      >
                        <div className="flex items-center gap-3">
                          {post.readingTime ? (
                            <div
                              className="flex items-center gap-1"
                              style={{
                                fontFamily: "var(--font-home-sans)",
                                fontSize: "0.8rem",
                                color: "var(--home-ink-muted)",
                              }}
                            >
                              <Clock className="h-3.5 w-3.5" />
                              <span>{post.readingTime}</span>
                            </div>
                          ) : null}

                          {post.tags && post.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {post.tags.slice(0, 2).map((tag) => (
                                <span key={tag} className="resume-chip">{tag}</span>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        <ArrowRight
                          className="h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-1"
                          style={{ color: "var(--home-haze)" }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="home-card home-project-card text-center">
                <h2
                  className="mb-4"
                  style={{
                    fontFamily: "var(--font-home-sans)",
                    fontSize: "2rem",
                    fontWeight: 700,
                    color: "var(--home-ink)",
                  }}
                >
                  Articles Coming Soon
                </h2>
                <p
                  className="mx-auto"
                  style={{
                    maxWidth: "40rem",
                    fontFamily: "var(--font-home-sans)",
                    color: "var(--home-ink-muted)",
                    lineHeight: 1.65,
                  }}
                >
                  I&apos;m working on more pieces about product thinking, analytics, and the decisions behind the tools I build.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
