import Link from "next/link";
import { ArrowRight } from "@/components/ui/ServerIcons";
import { WarmCard } from "@/components/ui/WarmCard";
import { Badge } from "@/components/ui/Badge";
import { caseStudiesData } from "@/constants/caseStudies";
import { constructMetadata } from "@/lib/seo";
import { SectionIntro } from "@/components/ui/SectionIntro";

export const metadata = constructMetadata({
  title: "Projects",
  description:
    "Projects across product strategy, analytics, platform reliability, and investment research tooling.",
  canonicalUrl: "/portfolio",
  aiMetadata: {
    profession: "Product Manager",
    expertise: [
      "Product Strategy",
      "Platform Scaling",
      "Data-Driven Decisions",
      "Cross-Functional Leadership",
      "Experimentation & A/B Testing",
    ],
    topics: [
      "Product Management Projects",
      "SaaS Product Strategy",
      "Revenue Impact",
      "User Growth",
    ],
    contentType: "Portfolio / Projects",
    context:
      "Portfolio of product management projects by Isaac Vazquez, showcasing strategic thinking, cross-functional leadership, and measurable business outcomes across SaaS and consumer technology products.",
    summary:
      "Projects demonstrating product management experience across platform scale, analytics, and investment research tooling.",
  },
});

export default function PortfolioPage() {
  const allStudies = Object.values(caseStudiesData);
  const featuredCaseStudies = allStudies.filter((cs) => cs.featured);
  const liveStudies = allStudies.filter((cs) => !cs.comingSoon);
  const strategyStudies = liveStudies.filter((study) =>
    /product|strategy|analytics/i.test(study.role)
  ).length;

  return (
    <div className="min-h-screen bg-[var(--surface-primary)] page-section">
      <div className="page-shell space-y-12">
        <div className="section-panel px-6 py-8 sm:px-8 sm:py-10">
          <SectionIntro
            eyebrow="Projects"
            size="lg"
            headingLevel={1}
            title="Projects across product, analytics, and platform work."
            description="A collection of projects spanning high-scale platforms, analytics work, and investment research experiences."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="surface-muted px-4 py-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Live case studies
              </p>
              <p className="mb-0 text-2xl font-semibold text-[var(--text-primary)]">
                {liveStudies.length}
              </p>
            </div>
            <div className="surface-muted px-4 py-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Featured work
              </p>
              <p className="mb-0 text-2xl font-semibold text-[var(--text-primary)]">
                {featuredCaseStudies.length}
              </p>
            </div>
            <div className="surface-muted px-4 py-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Strategy-heavy roles
              </p>
              <p className="mb-0 text-2xl font-semibold text-[var(--text-primary)]">
                {strategyStudies}+
              </p>
            </div>
          </div>
        </div>

        {featuredCaseStudies.length > 0 ? (
          <div>
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Featured projects
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredCaseStudies.map((study) => (
                <Link
                  key={study.slug}
                  href={study.link ?? `/portfolio/${study.slug}`}
                  className="group block h-full"
                >
                  <WarmCard padding="none" hover className="h-full overflow-hidden">
                    <div className="space-y-5 p-6">
                      <div className="flex items-center justify-between gap-3">
                        <span className="section-kicker">Project</span>
                        <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                          {study.timeline}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-[var(--text-primary)] transition-colors group-hover:text-[var(--color-primary)]">
                          {study.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-[var(--text-secondary)] line-clamp-3">
                          {study.overview.summary || study.description}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="surface-muted px-4 py-3">
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                            Role
                          </p>
                          <p className="mb-0 text-sm leading-relaxed text-[var(--text-primary)]">
                            {study.role}
                          </p>
                        </div>
                        <div className="surface-muted px-4 py-3">
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                            Impact
                          </p>
                          <p className="mb-0 text-sm leading-relaxed text-[var(--text-primary)]">
                            {study.metrics}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-[var(--border-primary)] pt-4">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                          Problem space
                        </p>
                        <p className="mb-0 text-sm leading-relaxed text-[var(--text-secondary)] line-clamp-3">
                          {study.problem.context}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {study.tools.slice(0, 2).map((tool) => (
                          <Badge key={tool} variant="outline">
                            {tool}
                          </Badge>
                        ))}
                        {study.tools.length > 2 ? (
                          <Badge variant="outline">+{study.tools.length - 2} more</Badge>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 border-t border-[var(--border-primary)] pt-4 text-sm font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--color-primary)]">
                        View project
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </WarmCard>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
