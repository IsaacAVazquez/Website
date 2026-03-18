import { WarmCard } from "@/components/ui/WarmCard";
import Link from "next/link";
import { ArrowRight } from "@/components/ui/ServerIcons";
import { caseStudiesData } from "@/constants/caseStudies";
import { constructMetadata } from "@/lib/seo";
import { SectionIntro } from "@/components/ui/SectionIntro";

export const metadata = constructMetadata({
  title: "Projects | Isaac Vazquez",
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

  return (
    <main className="min-h-screen bg-[var(--surface-primary)] page-section">
      <div className="page-shell">
        <SectionIntro
          eyebrow="Projects"
          size="lg"
          title="Projects across product, analytics, and platform work."
          description="A collection of projects spanning high-scale platforms, analytics work, and investment research experiences."
        />

        {featuredCaseStudies.length > 0 && (
          <div className="mb-14 mt-12">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Featured projects
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredCaseStudies.map((study) => (
                <Link key={study.slug} href={study.link ?? `/portfolio/${study.slug}`}>
                  <WarmCard
                    padding="none"
                    hover={true}
                    className="group h-full overflow-hidden shadow-sm"
                  >
                    <div className="space-y-4 p-6">
                      <div className="flex items-center justify-between gap-3">
                        <span className="section-kicker">Project</span>
                        <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                          {study.timeline}
                        </span>
                      </div>

                      <h3 className="font-bold text-xl text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                        {study.title}
                      </h3>

                      <p className="text-sm leading-relaxed text-[var(--text-secondary)] line-clamp-3">
                        {study.description}
                      </p>

                      <div className="space-y-1 border-l-2 border-[var(--border-primary)] pl-3">
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                          Role: {study.role}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {study.metrics}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {study.tools.slice(0, 3).map((tool) => (
                          <span
                            key={tool}
                            className="px-2 py-1 text-xs font-medium rounded-full bg-[var(--surface-secondary)] text-[var(--text-secondary)]"
                          >
                            {tool}
                          </span>
                        ))}
                        {study.tools.length > 3 && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-[var(--surface-secondary)] text-[var(--text-secondary)]">
                            +{study.tools.length - 3}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors pt-2">
                        View project
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </WarmCard>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
