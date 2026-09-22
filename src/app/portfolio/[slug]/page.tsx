import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AIStructuredData } from "@/components/AIStructuredData";
import { ArrowLeft, ArrowRight, ExternalLink, BrandGithub } from "@/components/ui/ServerIcons";
import { caseStudiesData, getPortfolioProjects } from "@/constants/caseStudies";
import {
  absoluteUrl,
  constructMetadata,
  fitSearchTitle,
  siteConfig,
} from "@/lib/seo";

const CASE_STUDY_SEO_DATE = "2026-04-04";

export async function generateStaticParams() {
  return Object.keys(caseStudiesData).map((slug) => ({
    slug: slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = caseStudiesData[slug];

  if (!caseStudy) {
    return {
      title: "Case Study Not Found",
    };
  }

  return constructMetadata({
    title: fitSearchTitle(caseStudy.title),
    description: caseStudy.description,
    ogType: "article",
    datePublished: CASE_STUDY_SEO_DATE,
    dateModified: CASE_STUDY_SEO_DATE,
    articleAuthor: `${siteConfig.url}/about`,
    articleSection: "Product Management",
    articleTags: ["Product Management", caseStudy.role, ...caseStudy.tools.slice(0, 3)],
    canonicalUrl: `/portfolio/${slug}`,
  });
}

/*
 * Layout constants for the Catalog 97 composition. A band stacks its children
 * at step 3 and a sub-block (an h3 with the prose or list under it) at step 2,
 * so the page never hand-rolls a gap.
 */
const bandStack = { display: "grid", gap: "var(--c97-sp-3)" } as const;
const blockStack = { display: "grid", gap: "var(--c97-sp-2)" } as const;
const secondaryInk = { color: "var(--c97-ink-2)" } as const;

/* Two panels side by side, collapsing to one column on a phone. */
const pairGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
  gap: "var(--c97-sp-2)",
} as const;

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caseStudy = caseStudiesData[slug];

  if (!caseStudy) {
    notFound();
  }

  if (caseStudy.link) {
    redirect(caseStudy.link);
  }

  const allSlugs = getPortfolioProjects().map((study) => study.slug);
  const currentIndex = allSlugs.indexOf(slug);
  const prevSlug = currentIndex > 0 ? allSlugs[currentIndex - 1] : null;
  const nextSlug =
    currentIndex >= 0 && currentIndex < allSlugs.length - 1
      ? allSlugs[currentIndex + 1]
      : null;
  const prevCaseStudy = prevSlug ? caseStudiesData[prevSlug] : null;
  const nextCaseStudy = nextSlug ? caseStudiesData[nextSlug] : null;
  const projectUrl = absoluteUrl(`/portfolio/${slug}`);
  const projectKeywords = Array.from(
    new Set(["Product Management", "Case Study", caseStudy.role, ...caseStudy.tools])
  );
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Work", url: "/portfolio" },
    { name: caseStudy.title, url: `/portfolio/${slug}` },
  ];

  return (
    <>
      <AIStructuredData
        schema={{
          type: "Breadcrumb",
          data: { items: breadcrumbs },
        }}
      />
      <AIStructuredData
        schema={{
          type: "Project",
          data: {
            name: caseStudy.title,
            description: caseStudy.description,
            url: projectUrl,
            datePublished: CASE_STUDY_SEO_DATE,
            dateModified: CASE_STUDY_SEO_DATE,
            author: {
              name: siteConfig.name,
              jobTitle: "Product Manager",
              url: siteConfig.url,
            },
            creator: {
              name: siteConfig.name,
              jobTitle: "Product Manager",
              url: siteConfig.url,
            },
            keywords: projectKeywords,
            skillsUsed: caseStudy.tools,
            technologies: caseStudy.tools,
            problemSolved: caseStudy.problem.context || caseStudy.overview.summary,
            solutionDescription:
              caseStudy.process.approach || caseStudy.overview.summary,
            impact: caseStudy.overview.impact || caseStudy.metrics,
            isPartOf: {
              "@type": "CollectionPage",
              name: "Isaac Vazquez Projects",
              url: absoluteUrl("/portfolio"),
            },
          },
        }}
      />

      <article aria-label={caseStudy.title}>
        {/* Hero */}
        <section className="c97-band" data-c97-surface="paper">
          <div className="c97-shell" style={bandStack}>
            <nav aria-label="Breadcrumb">
              <ol className="c97-breadcrumb">
                <li>
                  <Link href="/" className="c97-microlink">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/portfolio" className="c97-microlink">
                    Work
                  </Link>
                </li>
                <li aria-current="page">{caseStudy.title}</li>
              </ol>
            </nav>

            <header style={blockStack}>
              <p className="c97-kicker">{caseStudy.role} · Case study</p>
              <h1 className="c97-display">{caseStudy.title}</h1>
              <p className="c97-meta">
                <span>Role: {caseStudy.role}</span>
                <span>Timeline: {caseStudy.timeline}</span>
                {caseStudy.pmFramework && <span>Framework: {caseStudy.pmFramework}</span>}
              </p>
            </header>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--c97-sp-1)" }}>
              {caseStudy.tools.map((tool) => (
                <span key={tool} className="c97-chip">
                  {tool}
                </span>
              ))}
            </div>

            {(caseStudy.github || caseStudy.link) && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "var(--c97-sp-2)",
                  alignItems: "center",
                }}
              >
                {caseStudy.github && (
                  <a
                    href={caseStudy.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="c97-btn"
                    style={{ gap: "var(--c97-sp-1)" }}
                  >
                    <BrandGithub className="h-4 w-4" />
                    View code
                  </a>
                )}
                {caseStudy.link && (
                  caseStudy.link.startsWith("/") ? (
                    <Link
                      href={caseStudy.link}
                      className="c97-btn-ghost"
                      style={{ gap: "var(--c97-sp-1)" }}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Live project
                    </Link>
                  ) : (
                    <a
                      href={caseStudy.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="c97-btn-ghost"
                      style={{ gap: "var(--c97-sp-1)" }}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Live project
                    </a>
                  )
                )}
              </div>
            )}
          </div>
        </section>

        {/* Overview */}
        <section className="c97-band" data-c97-surface="bone">
          <div className="c97-shell" style={bandStack}>
            <div>
              <p className="c97-kicker">Case study</p>
              <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-1)" }}>
                Overview
              </h2>
            </div>
            {/* Bare `.c97-lead` sets only the size, so the global paragraph margin is zeroed here. */}
            <p className="c97-lead" style={{ margin: 0 }}>
              {caseStudy.overview.summary}
            </p>
            <div style={blockStack}>
              <p className="c97-kicker">Impact</p>
              <p className="c97-prose">{caseStudy.overview.impact}</p>
            </div>

            {caseStudy.detailedMetrics && (
              <div className="c97-columns">
                {caseStudy.detailedMetrics.map((metric, index) => (
                  <div key={index} className="c97-stat">
                    <p className="c97-stat-label">{metric.label}</p>
                    <p className="c97-stat-value c97-tabular">{metric.value}</p>
                    {metric.improvement && (
                      <p className="c97-stat-delta">{metric.improvement}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* User Segments & North Star */}
        <section className="c97-band" data-c97-surface="paper">
          <div className="c97-shell" style={bandStack}>
            <div>
              <p className="c97-kicker">Case study</p>
              <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-1)" }}>
                User segments and north star
              </h2>
            </div>
            <div style={blockStack}>
              <h3 className="c97-serif c97-h3">Who was this built for?</h3>
              <ul className="c97-list">
                {caseStudy.userSegments.map((segment, index) => (
                  <li key={index}>{segment}</li>
                ))}
              </ul>
            </div>
            <div className="c97-panel" style={blockStack}>
              <p className="c97-kicker">North star metric</p>
              <p className="c97-serif c97-h3">{caseStudy.northStarMetric}</p>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="c97-band" data-c97-surface="bone">
          <div className="c97-shell" style={bandStack}>
            <div>
              <p className="c97-kicker">Case study</p>
              <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-1)" }}>
                Problem
              </h2>
            </div>

            <div style={blockStack}>
              <h3 className="c97-serif c97-h3">Context</h3>
              <p className="c97-prose">{caseStudy.problem.context}</p>
            </div>

            <div style={blockStack}>
              <h3 className="c97-serif c97-h3">Pain points</h3>
              <ul className="c97-list">
                {caseStudy.problem.painPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>

            <div className="c97-panel" style={blockStack}>
              <h3 className="c97-serif c97-h3">Stakes</h3>
              <p className="c97-prose">{caseStudy.problem.stakes}</p>
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="c97-band" data-c97-surface="paper">
          <div className="c97-shell" style={bandStack}>
            <div>
              <p className="c97-kicker">Case study</p>
              <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-1)" }}>
                Process
              </h2>
            </div>

            <div style={blockStack}>
              <h3 className="c97-serif c97-h3">Approach</h3>
              <p className="c97-prose">{caseStudy.process.approach}</p>
            </div>

            <div style={blockStack}>
              <h3 className="c97-serif c97-h3">Methodology</h3>
              <ul className="c97-list">
                {caseStudy.process.methodology.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>

            {caseStudy.process.decisions && (
              <div style={blockStack}>
                <h3 className="c97-serif c97-h3">Key decisions</h3>
                <ul className="c97-list">
                  {caseStudy.process.decisions.map((decision, index) => (
                    <li key={index}>{decision}</li>
                  ))}
                </ul>
              </div>
            )}

            {caseStudy.process.collaboration && (
              <div className="c97-panel" style={blockStack}>
                <h3 className="c97-serif c97-h3">Collaboration</h3>
                <p className="c97-prose">{caseStudy.process.collaboration}</p>
              </div>
            )}
          </div>
        </section>

        {/* Tradeoff Analysis */}
        {caseStudy.tradeoffs && caseStudy.tradeoffs.length > 0 && (
          <section className="c97-band" data-c97-surface="bone">
            <div className="c97-shell" style={bandStack}>
              <div>
                <p className="c97-kicker">Case study</p>
                <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-1)" }}>
                  Tradeoff analysis
                </h2>
              </div>
              {caseStudy.tradeoffs.map((tradeoff, index) => (
                <div key={index} style={blockStack}>
                  <h3 className="c97-serif c97-h3">{tradeoff.decision}</h3>
                  <div style={pairGrid}>
                    <div className="c97-panel" style={{ display: "grid", gap: "var(--c97-sp-1)" }}>
                      <p className="c97-kicker" style={{ color: "var(--c97-accent)" }}>
                        Chose
                      </p>
                      <p className="c97-prose">{tradeoff.optionChosen}</p>
                    </div>
                    <div className="c97-panel" style={{ display: "grid", gap: "var(--c97-sp-1)" }}>
                      <p className="c97-kicker">Rejected</p>
                      <p className="c97-prose" style={secondaryInk}>
                        {tradeoff.optionRejected}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: "var(--c97-sp-1)" }}>
                    <p className="c97-kicker">Reasoning</p>
                    <p className="c97-prose">{tradeoff.reasoning}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Results */}
        <section className="c97-band" data-c97-surface="paper">
          <div className="c97-shell" style={bandStack}>
            <div>
              <p className="c97-kicker">Case study</p>
              <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-1)" }}>
                Results
              </h2>
            </div>

            <div style={blockStack}>
              <h3 className="c97-serif c97-h3">Outcomes</h3>
              <ul className="c97-list">
                {caseStudy.result.outcomes.map((outcome, index) => (
                  <li key={index}>{outcome}</li>
                ))}
              </ul>
            </div>

            {caseStudy.result.testimonial && (
              <figure
                style={{
                  ...blockStack,
                  margin: 0,
                  borderLeft: "2px solid var(--c97-accent)",
                  paddingLeft: "var(--c97-sp-3)",
                }}
              >
                <blockquote className="c97-serif c97-lead" style={secondaryInk}>
                  &ldquo;{caseStudy.result.testimonial.quote}&rdquo;
                </blockquote>
                <figcaption className="c97-meta">
                  <span>
                    <cite style={{ fontStyle: "normal" }}>
                      {caseStudy.result.testimonial.author}
                    </cite>
                    , {caseStudy.result.testimonial.role}
                  </span>
                </figcaption>
              </figure>
            )}

            {caseStudy.result.lessonsLearned && caseStudy.result.lessonsLearned.length > 0 && (
              <div style={blockStack}>
                <h3 className="c97-serif c97-h3">Lessons learned</h3>
                <ul className="c97-list">
                  {caseStudy.result.lessonsLearned.map((lesson, index) => (
                    <li key={index}>{lesson}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Retrospective */}
        {caseStudy.retrospective && (
          <section className="c97-band" data-c97-surface="bone">
            <div className="c97-shell" style={bandStack}>
              <div>
                <p className="c97-kicker">Case study</p>
                <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-1)" }}>
                  Retrospective
                </h2>
              </div>
              <div style={blockStack}>
                <h3 className="c97-serif c97-h3">What I&apos;d do differently</h3>
                <p className="c97-prose">{caseStudy.retrospective}</p>
              </div>
            </div>
          </section>
        )}

        {(prevCaseStudy || nextCaseStudy) && (
          <section className="c97-band" data-c97-surface="paper">
            <footer className="c97-shell" aria-label="Case study navigation">
              <div style={pairGrid}>
                {prevCaseStudy ? (
                  <Link
                    href={`/portfolio/${prevCaseStudy.slug}`}
                    rel="prev"
                    className="c97-row c97-link"
                    style={{
                      gridTemplateColumns: "auto 1fr",
                      alignItems: "start",
                      borderTop: "1px solid var(--c97-rule)",
                      paddingBlock: "var(--c97-sp-3)",
                      textDecoration: "none",
                    }}
                  >
                    {/* The arrow inherits the link colour, so `.c97-link:hover` is the only hover feedback. */}
                    <span aria-hidden="true">
                      <ArrowLeft className="h-5 w-5" />
                    </span>
                    <span style={{ display: "grid", gap: "var(--c97-sp-1)" }}>
                      <span className="c97-kicker">Previous case study</span>
                      <span className="c97-serif c97-h3">{prevCaseStudy.title}</span>
                      <span className="c97-prose" style={secondaryInk}>
                        {prevCaseStudy.description}
                      </span>
                    </span>
                  </Link>
                ) : (
                  <span aria-hidden="true" />
                )}
                {nextCaseStudy ? (
                  <Link
                    href={`/portfolio/${nextCaseStudy.slug}`}
                    rel="next"
                    className="c97-row c97-link"
                    style={{
                      alignItems: "start",
                      borderTop: "1px solid var(--c97-rule)",
                      paddingBlock: "var(--c97-sp-3)",
                      textDecoration: "none",
                    }}
                  >
                    <span style={{ display: "grid", gap: "var(--c97-sp-1)" }}>
                      <span className="c97-kicker">Next case study</span>
                      <span className="c97-serif c97-h3">{nextCaseStudy.title}</span>
                      <span className="c97-prose" style={secondaryInk}>
                        {nextCaseStudy.description}
                      </span>
                      <span className="c97-kicker" style={{ color: "var(--c97-accent)" }}>
                        {nextCaseStudy.metrics}
                      </span>
                    </span>
                    <span aria-hidden="true">
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </Link>
                ) : (
                  <span aria-hidden="true" />
                )}
              </div>
            </footer>
          </section>
        )}
      </article>
    </>
  );
}
