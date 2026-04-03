import { ModernButton } from "@/components/ui/ModernButton";
import { getHomepageFeaturedCaseStudies } from "@/constants/caseStudies";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { PortfolioProjectCard } from "@/components/PortfolioProjectCard";

export function FeaturedWorkSection() {
  const featured = getHomepageFeaturedCaseStudies();

  return (
    <section
      className="page-section bg-[var(--surface-primary)]"
      aria-label="Projects"
    >
      <div className="page-shell">
        <div>
          <div className="mb-8 lg:mb-10">
            <SectionIntro
              headingLevel={2}
              title="Selected Projects"
              description="Each project shows the problem I was solving, the decisions I made, and what actually changed."
              titleClassName="text-3xl leading-[1.05] sm:text-4xl lg:text-[2.9rem]"
              descriptionClassName="max-w-2xl text-base lg:text-lg"
            />
          </div>

          <div className="mb-10 grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((study) => (
              <PortfolioProjectCard key={study.slug} study={study} />
            ))}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              A broader set of product and analytics work lives in the projects section, with full case-study context and project details.
            </p>
            <ModernButton href="/portfolio" variant="outline" size="lg">
              View all projects
            </ModernButton>
          </div>
        </div>
      </div>
    </section>
  );
}
