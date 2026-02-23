import { Metadata } from "next";
import Link from "next/link";
import { Heading } from "@/components/ui/Heading";
import { WarmCard } from "@/components/ui/WarmCard";
import { IconArrowRight, IconExternalLink } from "@tabler/icons-react";
import { caseStudiesData } from "@/constants/caseStudies";

export const metadata: Metadata = {
  title: "Work & Case Studies | Isaac Vazquez",
  description:
    "PM case studies: scaling platforms to 60M+ users, driving $4M revenue impact, transforming analytics. Problem-Process-Result framework.",
};

export default function PortfolioPage() {
  const allStudies = Object.values(caseStudiesData);
  const featuredCaseStudies = allStudies.filter((cs) => cs.featured);
  const otherCaseStudies = allStudies.filter((cs) => !cs.featured);

  return (
    <main className="min-h-screen bg-[var(--surface-primary)] py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <Heading level={1} className="mb-6">
            Work & Case Studies
          </Heading>
          <p className="text-lg text-[var(--text-secondary)] max-w-3xl">
            Case studies showcasing product management expertise through
            strategic thinking, cross-functional leadership, and measurable
            business outcomes. Each follows the Problem-Process-Result
            framework.
          </p>
        </div>

        {featuredCaseStudies.length > 0 && (
          <div className="mb-14">
            <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">
              Featured Work
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCaseStudies.map((study) => (
                <Link key={study.slug} href={`/portfolio/${study.slug}`}>
                  <WarmCard
                    padding="none"
                    hover={true}
                    className="h-full overflow-hidden group"
                  >
                    <div className="p-6 space-y-4">
                      <h3 className="font-bold text-xl text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                        {study.title}
                      </h3>

                      <p className="text-sm text-[var(--text-secondary)] line-clamp-3">
                        {study.description}
                      </p>

                      <div className="space-y-1">
                        <p className="text-xs font-medium text-[var(--text-tertiary)]">
                          Role: {study.role}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {study.timeline}
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

                      <p className="text-xs font-semibold text-[var(--color-primary)]">
                        {study.metrics}
                      </p>

                      <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors pt-2">
                        View Case Study
                        <IconArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </WarmCard>
                </Link>
              ))}
            </div>
          </div>
        )}

        {otherCaseStudies.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">
              More Work
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {otherCaseStudies.map((study) => (
                <Link key={study.slug} href={`/portfolio/${study.slug}`}>
                  <WarmCard
                    padding="lg"
                    hover={true}
                    className="h-full group"
                  >
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                        {study.title}
                      </h3>

                      <p className="text-sm text-[var(--text-secondary)]">
                        {study.description}
                      </p>

                      <p className="text-xs font-medium text-[var(--text-tertiary)]">
                        {study.role} · {study.timeline}
                      </p>

                      <p className="text-xs font-semibold text-[var(--color-primary)]">
                        {study.metrics}
                      </p>

                      <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors pt-2">
                        View Case Study
                        <IconArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </WarmCard>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-lg text-[var(--text-secondary)] mb-6">
            Interested in working together?
          </p>
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Get In Touch
            <IconExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
