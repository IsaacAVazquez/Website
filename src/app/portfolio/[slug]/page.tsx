import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Heading } from "@/components/ui/Heading";
import { WarmCard } from "@/components/ui/WarmCard";
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
    <div className="min-h-screen bg-[var(--surface-primary)] dark:bg-[var(--neutral-950)] py-24 md:py-32">
      <article className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-[var(--color-primary)] transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portfolio
        </Link>

        <header className="mb-12">
          <Heading level={1} className="mb-4">
            {caseStudy.title}
          </Heading>

          <div className="flex flex-wrap gap-4 text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            <span>
              <strong>Role:</strong> {caseStudy.role}
            </span>
            <span>&middot;</span>
            <span>
              <strong>Timeline:</strong> {caseStudy.timeline}
            </span>
            {caseStudy.pmFramework && (
              <>
                <span>&middot;</span>
                <span>
                  <strong>Framework:</strong> {caseStudy.pmFramework}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {caseStudy.tools.map((tool) => (
              <span
                key={tool}
                className="px-3 py-1 text-sm font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              >
                {tool}
              </span>
            ))}
          </div>

          <div className="flex gap-4">
            {caseStudy.github && (
              <a
                href={caseStudy.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
              >
                <BrandGithub className="h-4 w-4" />
                View Code
              </a>
            )}
            {caseStudy.link && (
              caseStudy.link.startsWith("/") ? (
                <Link
                  href={caseStudy.link}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Live Project
                </Link>
              ) : (
                <a
                  href={caseStudy.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Live Project
                </a>
              )
            )}
          </div>
        </header>

        {/* Overview */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">
            Overview
          </h2>
          <WarmCard
            padding="lg"
            className="mb-6 border border-neutral-200 dark:border-neutral-700"
          >
            <p className="text-lg text-neutral-700 dark:text-neutral-300 mb-4">
              {caseStudy.overview.summary}
            </p>
            <p className="text-base text-neutral-600 dark:text-neutral-400">
              <strong className="text-neutral-900 dark:text-neutral-100">
                Impact:
              </strong>{" "}
              {caseStudy.overview.impact}
            </p>
          </WarmCard>

          {caseStudy.detailedMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {caseStudy.detailedMetrics.map((metric, index) => (
                <WarmCard
                  key={index}
                  padding="md"
                  className="text-center border border-neutral-200 dark:border-neutral-700"
                >
                  <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">
                    {metric.label}
                  </p>
                  <p className="text-2xl font-bold text-[var(--color-primary)] mb-1">
                    {metric.value}
                  </p>
                  {metric.improvement && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {metric.improvement}
                    </p>
                  )}
                </WarmCard>
              ))}
            </div>
          )}
        </section>

        {/* User Segments & North Star */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">
            User Segments & North Star
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                Who Was This Built For?
              </h3>
              <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300">
                {caseStudy.userSegments.map((segment, index) => (
                  <li key={index}>{segment}</li>
                ))}
              </ul>
            </div>
            <WarmCard
              padding="lg"
              className="border border-neutral-200 dark:border-neutral-700"
            >
              <h3 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
                North Star Metric
              </h3>
              <p className="text-lg text-[var(--color-primary)] font-medium">
                {caseStudy.northStarMetric}
              </p>
            </WarmCard>
          </div>
        </section>

        {/* Problem */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">
            Problem
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                Context
              </h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                {caseStudy.problem.context}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                Pain Points
              </h3>
              <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300">
                {caseStudy.problem.painPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>

            <WarmCard
              padding="lg"
              className="bg-[var(--surface-secondary)] border border-[var(--border-primary)]"
            >
              <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                Stakes
              </h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                {caseStudy.problem.stakes}
              </p>
            </WarmCard>
          </div>
        </section>

        {/* Process */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">
            Process
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                Approach
              </h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                {caseStudy.process.approach}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                Methodology
              </h3>
              <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300">
                {caseStudy.process.methodology.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>

            {caseStudy.process.decisions && (
              <div>
                <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                  Key Decisions
                </h3>
                <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300">
                  {caseStudy.process.decisions.map((decision, index) => (
                    <li key={index}>{decision}</li>
                  ))}
                </ul>
              </div>
            )}

            {caseStudy.process.collaboration && (
              <WarmCard
                padding="lg"
                className="border border-neutral-200 dark:border-neutral-700"
              >
                <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                  Collaboration
                </h3>
                <p className="text-neutral-700 dark:text-neutral-300">
                  {caseStudy.process.collaboration}
                </p>
              </WarmCard>
            )}
          </div>
        </section>

        {/* Tradeoff Analysis */}
        {caseStudy.tradeoffs && caseStudy.tradeoffs.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">
              Tradeoff Analysis
            </h2>
            <div className="space-y-4">
              {caseStudy.tradeoffs.map((tradeoff, index) => (
                <WarmCard
                  key={index}
                  padding="lg"
                  className="border border-neutral-200 dark:border-neutral-700"
                >
                  <h3 className="text-lg font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                    {tradeoff.decision}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-3">
                    <div className="p-3 rounded-lg bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20">
                      <p className="text-xs font-medium text-[var(--color-primary)] mb-1">
                        Chose
                      </p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {tradeoff.optionChosen}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                      <p className="text-xs font-medium text-neutral-500 mb-1">
                        Rejected
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {tradeoff.optionRejected}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    <strong className="text-neutral-900 dark:text-neutral-100">
                      Reasoning:
                    </strong>{" "}
                    {tradeoff.reasoning}
                  </p>
                </WarmCard>
              ))}
            </div>
          </section>
        )}

        {/* Results */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">
            Results
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                Outcomes
              </h3>
              <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300">
                {caseStudy.result.outcomes.map((outcome, index) => (
                  <li key={index}>{outcome}</li>
                ))}
              </ul>
            </div>

            {caseStudy.result.testimonial && (
              <WarmCard
                padding="lg"
                className="bg-[var(--surface-secondary)] border-l-4 border-[var(--color-primary)]"
              >
                <blockquote className="text-lg italic text-neutral-700 dark:text-neutral-300 mb-4">
                  &ldquo;{caseStudy.result.testimonial.quote}&rdquo;
                </blockquote>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  &mdash; {caseStudy.result.testimonial.author},{" "}
                  {caseStudy.result.testimonial.role}
                </p>
              </WarmCard>
            )}

            {caseStudy.result.lessonsLearned &&
              caseStudy.result.lessonsLearned.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                    Lessons Learned
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300">
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
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">
              Retrospective
            </h2>
            <WarmCard
              padding="lg"
              className="bg-[var(--surface-secondary)] border border-[var(--border-primary)]"
            >
              <h3 className="text-lg font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                What I&apos;d Do Differently
              </h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                {caseStudy.retrospective}
              </p>
            </WarmCard>
          </section>
        )}

        {nextCaseStudy && (
          <footer className="pt-12 border-t border-neutral-200 dark:border-neutral-800">
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-500 mb-4">
              Next Case Study
            </h3>
            <Link href={`/portfolio/${nextCaseStudy.slug}`}>
              <WarmCard
                padding="lg"
                hover={true}
                className="border border-neutral-200 dark:border-neutral-700 group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xl font-bold mb-2 text-neutral-900 dark:text-neutral-100 group-hover:text-[var(--color-primary)] transition-colors">
                      {nextCaseStudy.title}
                    </h4>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                      {nextCaseStudy.description}
                    </p>
                    <p className="text-sm text-[var(--color-primary)] font-medium">
                      {nextCaseStudy.metrics}
                    </p>
                  </div>
                  <ArrowRight className="ml-4 h-6 w-6 flex-shrink-0 text-neutral-400 transition-[color,transform] group-hover:translate-x-1 group-hover:text-[var(--color-primary)]" />
                </div>
              </WarmCard>
            </Link>
          </footer>
        )}
      </article>
    </div>
  );
}
