import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink, BrandGithub } from "@/components/ui/ServerIcons";
import { caseStudiesData, getPortfolioProjects } from "@/constants/caseStudies";
import { constructMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  return Object.keys(caseStudiesData).map((slug) => ({
    slug: slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const caseStudy = caseStudiesData[params.slug];

  if (!caseStudy) {
    return {
      title: "Case Study Not Found",
    };
  }

  return constructMetadata({
    title: caseStudy.title,
    description: caseStudy.description,
    ogType: "article",
    articleAuthor: "https://isaacavazquez.com/about",
    articleSection: "Product Management",
    articleTags: ["Product Management", caseStudy.role, ...caseStudy.tools.slice(0, 3)],
    canonicalUrl: `/portfolio/${params.slug}`,
    aiMetadata: {
      profession: "Product Manager",
      expertise: caseStudy.tools,
      topics: [
        "Product Management Case Study",
        caseStudy.role,
        ...caseStudy.tools.slice(0, 3),
      ],
      contentType: "Case Study",
      context: `PM case study: ${caseStudy.role} — ${caseStudy.overview.summary}. Key metrics: ${caseStudy.metrics}.`,
      summary: caseStudy.overview.summary,
    },
  });
}

const sectionTitleStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink)",
  fontWeight: 600,
  letterSpacing: "-0.03em",
} as const;

const subsectionTitleStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink)",
  fontWeight: 600,
  letterSpacing: "-0.02em",
} as const;

const bodyStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink-muted)",
} as const;

const strongStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink)",
  fontWeight: 600,
} as const;

const chipStyle = {
  fontFamily: "var(--font-home-sans)",
  background: "color-mix(in srgb, var(--home-paper-alt) 84%, white)",
  color: "var(--home-ink)",
  border: "1px solid var(--home-rule)",
  letterSpacing: "0.02em",
} as const;

const outlineButtonStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink)",
  background: "color-mix(in srgb, var(--home-paper-alt) 84%, white)",
  border: "1px solid var(--home-rule)",
} as const;

export default function CaseStudyPage({
  params,
}: {
  params: { slug: string };
}) {
  const caseStudy = caseStudiesData[params.slug];

  if (!caseStudy) {
    notFound();
  }

  if (caseStudy.link) {
    redirect(caseStudy.link);
  }

  const allSlugs = getPortfolioProjects().map((study) => study.slug);
  const currentIndex = allSlugs.indexOf(params.slug);
  const nextSlug =
    currentIndex < allSlugs.length - 1 ? allSlugs[currentIndex + 1] : null;
  const nextCaseStudy = nextSlug ? caseStudiesData[nextSlug] : null;

  return (
    <section className="home-page home-section min-h-screen" aria-label={caseStudy.title}>
      <article className="home-shell home-shell-tight space-y-12">
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
          style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portfolio
        </Link>

        <header className="space-y-5">
          <p className="home-kicker mb-0">{caseStudy.role} · Case study</p>
          <h1
            className="mb-0"
            style={{
              fontFamily: "var(--font-home-sans)",
              fontSize: "clamp(2.4rem, 5.5vw, 4rem)",
              fontWeight: 600,
              lineHeight: 0.95,
              letterSpacing: "-0.06em",
              color: "var(--home-ink)",
            }}
          >
            {caseStudy.title}
          </h1>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm" style={bodyStyle}>
            <span>
              <strong style={strongStyle}>Role:</strong> {caseStudy.role}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong style={strongStyle}>Timeline:</strong> {caseStudy.timeline}
            </span>
            {caseStudy.pmFramework && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  <strong style={strongStyle}>Framework:</strong> {caseStudy.pmFramework}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {caseStudy.tools.map((tool) => (
              <span
                key={tool}
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                style={chipStyle}
              >
                {tool}
              </span>
            ))}
          </div>

          {(caseStudy.github || caseStudy.link) && (
            <div className="flex flex-wrap gap-3 pt-2">
              {caseStudy.github && (
                <a
                  href={caseStudy.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
                  style={outlineButtonStyle}
                >
                  <BrandGithub className="h-4 w-4" />
                  View code
                </a>
              )}
              {caseStudy.link && (
                caseStudy.link.startsWith("/") ? (
                  <Link
                    href={caseStudy.link}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
                    style={outlineButtonStyle}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Live project
                  </Link>
                ) : (
                  <a
                    href={caseStudy.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
                    style={outlineButtonStyle}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Live project
                  </a>
                )
              )}
            </div>
          )}
        </header>

        {/* Overview */}
        <section className="space-y-5">
          <h2 className="text-3xl mb-0" style={sectionTitleStyle}>
            Overview
          </h2>
          <div className="home-card p-6 sm:p-8 space-y-4">
            <p className="mb-0 text-lg leading-7" style={bodyStyle}>
              {caseStudy.overview.summary}
            </p>
            <p className="mb-0 text-base leading-7" style={bodyStyle}>
              <strong style={strongStyle}>Impact:</strong> {caseStudy.overview.impact}
            </p>
          </div>

          {caseStudy.detailedMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {caseStudy.detailedMetrics.map((metric, index) => (
                <div
                  key={index}
                  className="home-card p-5 text-center space-y-1"
                >
                  <p
                    className="mb-0 text-xs font-semibold uppercase tracking-wider"
                    style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)", letterSpacing: "0.1em" }}
                  >
                    {metric.label}
                  </p>
                  <p
                    className="mb-0 text-2xl"
                    style={{ ...subsectionTitleStyle, fontWeight: 700 }}
                  >
                    {metric.value}
                  </p>
                  {metric.improvement && (
                    <p className="mb-0 text-xs" style={bodyStyle}>
                      {metric.improvement}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* User Segments & North Star */}
        <section className="space-y-5">
          <h2 className="text-3xl mb-0" style={sectionTitleStyle}>
            User segments & north star
          </h2>
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-xl mb-0" style={subsectionTitleStyle}>
                Who was this built for?
              </h3>
              <ul className="mb-0 list-disc space-y-2 pl-5 text-base leading-7" style={bodyStyle}>
                {caseStudy.userSegments.map((segment, index) => (
                  <li key={index}>{segment}</li>
                ))}
              </ul>
            </div>
            <div className="home-card p-6 sm:p-8 space-y-2">
              <h3 className="text-xl mb-0" style={subsectionTitleStyle}>
                North star metric
              </h3>
              <p className="mb-0 text-lg font-semibold" style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-haze)" }}>
                {caseStudy.northStarMetric}
              </p>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="space-y-5">
          <h2 className="text-3xl mb-0" style={sectionTitleStyle}>
            Problem
          </h2>
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-xl mb-0" style={subsectionTitleStyle}>
                Context
              </h3>
              <p className="mb-0 text-base leading-7" style={bodyStyle}>
                {caseStudy.problem.context}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl mb-0" style={subsectionTitleStyle}>
                Pain points
              </h3>
              <ul className="mb-0 list-disc space-y-2 pl-5 text-base leading-7" style={bodyStyle}>
                {caseStudy.problem.painPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>

            <div
              className="home-card p-6 sm:p-8 space-y-3"
              style={{ background: "color-mix(in srgb, var(--home-paper-alt) 78%, white)" }}
            >
              <h3 className="text-xl mb-0" style={subsectionTitleStyle}>
                Stakes
              </h3>
              <p className="mb-0 text-base leading-7" style={bodyStyle}>
                {caseStudy.problem.stakes}
              </p>
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="space-y-5">
          <h2 className="text-3xl mb-0" style={sectionTitleStyle}>
            Process
          </h2>
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-xl mb-0" style={subsectionTitleStyle}>
                Approach
              </h3>
              <p className="mb-0 text-base leading-7" style={bodyStyle}>
                {caseStudy.process.approach}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl mb-0" style={subsectionTitleStyle}>
                Methodology
              </h3>
              <ul className="mb-0 list-disc space-y-2 pl-5 text-base leading-7" style={bodyStyle}>
                {caseStudy.process.methodology.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>

            {caseStudy.process.decisions && (
              <div className="space-y-3">
                <h3 className="text-xl mb-0" style={subsectionTitleStyle}>
                  Key decisions
                </h3>
                <ul className="mb-0 list-disc space-y-2 pl-5 text-base leading-7" style={bodyStyle}>
                  {caseStudy.process.decisions.map((decision, index) => (
                    <li key={index}>{decision}</li>
                  ))}
                </ul>
              </div>
            )}

            {caseStudy.process.collaboration && (
              <div className="home-card p-6 sm:p-8 space-y-3">
                <h3 className="text-xl mb-0" style={subsectionTitleStyle}>
                  Collaboration
                </h3>
                <p className="mb-0 text-base leading-7" style={bodyStyle}>
                  {caseStudy.process.collaboration}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Tradeoff Analysis */}
        {caseStudy.tradeoffs && caseStudy.tradeoffs.length > 0 && (
          <section className="space-y-5">
            <h2 className="text-3xl mb-0" style={sectionTitleStyle}>
              Tradeoff analysis
            </h2>
            <div className="space-y-4">
              {caseStudy.tradeoffs.map((tradeoff, index) => (
                <div
                  key={index}
                  className="home-card p-6 sm:p-8 space-y-4"
                >
                  <h3 className="text-lg mb-0" style={subsectionTitleStyle}>
                    {tradeoff.decision}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div
                      className="rounded-xl p-4 space-y-1"
                      style={{
                        background: "color-mix(in srgb, var(--home-haze) 10%, var(--home-paper))",
                        border: "1px solid color-mix(in srgb, var(--home-haze) 35%, var(--home-rule))",
                      }}
                    >
                      <p className="mb-0 text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-haze)", letterSpacing: "0.1em" }}>
                        Chose
                      </p>
                      <p className="mb-0 text-sm font-semibold" style={strongStyle}>
                        {tradeoff.optionChosen}
                      </p>
                    </div>
                    <div
                      className="rounded-xl p-4 space-y-1"
                      style={{
                        background: "color-mix(in srgb, var(--home-paper-alt) 78%, white)",
                        border: "1px solid var(--home-rule)",
                      }}
                    >
                      <p className="mb-0 text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)", letterSpacing: "0.1em" }}>
                        Rejected
                      </p>
                      <p className="mb-0 text-sm" style={bodyStyle}>
                        {tradeoff.optionRejected}
                      </p>
                    </div>
                  </div>
                  <p className="mb-0 text-sm leading-6" style={bodyStyle}>
                    <strong style={strongStyle}>Reasoning:</strong> {tradeoff.reasoning}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Results */}
        <section className="space-y-5">
          <h2 className="text-3xl mb-0" style={sectionTitleStyle}>
            Results
          </h2>
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-xl mb-0" style={subsectionTitleStyle}>
                Outcomes
              </h3>
              <ul className="mb-0 list-disc space-y-2 pl-5 text-base leading-7" style={bodyStyle}>
                {caseStudy.result.outcomes.map((outcome, index) => (
                  <li key={index}>{outcome}</li>
                ))}
              </ul>
            </div>

            {caseStudy.result.testimonial && (
              <div
                className="home-card p-6 sm:p-8 space-y-4"
                style={{
                  background: "color-mix(in srgb, var(--home-paper-alt) 78%, white)",
                  borderLeft: "3px solid var(--home-haze)",
                }}
              >
                <blockquote className="mb-0 text-lg italic leading-7" style={bodyStyle}>
                  &ldquo;{caseStudy.result.testimonial.quote}&rdquo;
                </blockquote>
                <p className="mb-0 text-sm" style={strongStyle}>
                  — {caseStudy.result.testimonial.author}, {caseStudy.result.testimonial.role}
                </p>
              </div>
            )}

            {caseStudy.result.lessonsLearned && caseStudy.result.lessonsLearned.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xl mb-0" style={subsectionTitleStyle}>
                  Lessons learned
                </h3>
                <ul className="mb-0 list-disc space-y-2 pl-5 text-base leading-7" style={bodyStyle}>
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
          <section className="space-y-5">
            <h2 className="text-3xl mb-0" style={sectionTitleStyle}>
              Retrospective
            </h2>
            <div
              className="home-card p-6 sm:p-8 space-y-3"
              style={{ background: "color-mix(in srgb, var(--home-paper-alt) 78%, white)" }}
            >
              <h3 className="text-lg mb-0" style={subsectionTitleStyle}>
                What I&apos;d do differently
              </h3>
              <p className="mb-0 text-base leading-7" style={bodyStyle}>
                {caseStudy.retrospective}
              </p>
            </div>
          </section>
        )}

        {nextCaseStudy && (
          <footer
            className="pt-10"
            style={{ borderTop: "1px solid var(--home-rule)" }}
          >
            <p className="home-kicker mb-3">Next case study</p>
            <Link href={`/portfolio/${nextCaseStudy.slug}`} className="block group">
              <div className="home-card home-project-card p-6 sm:p-8 transition-transform duration-200 group-hover:-translate-y-0.5">
                <div className="flex justify-between items-start gap-6">
                  <div className="space-y-2">
                    <h3 className="text-xl mb-0" style={subsectionTitleStyle}>
                      {nextCaseStudy.title}
                    </h3>
                    <p className="mb-0 text-base leading-7" style={bodyStyle}>
                      {nextCaseStudy.description}
                    </p>
                    <p className="mb-0 text-sm font-semibold" style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-haze)" }}>
                      {nextCaseStudy.metrics}
                    </p>
                  </div>
                  <ArrowRight
                    className="h-5 w-5 flex-shrink-0 transition-transform group-hover:translate-x-1"
                    style={{ color: "var(--home-ink-muted)" }}
                  />
                </div>
              </div>
            </Link>
          </footer>
        )}
      </article>
    </section>
  );
}
