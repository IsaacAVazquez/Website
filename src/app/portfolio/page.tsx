import { getPortfolioProjects } from "@/constants/caseStudies";
import { constructMetadata } from "@/lib/seo";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { PortfolioProjectCard } from "@/components/PortfolioProjectCard";

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
  const portfolioProjects = getPortfolioProjects();
  const featuredProjects = portfolioProjects.filter((study) => study.featured);
  const directCaseStudies = portfolioProjects.filter((study) => !study.link);
  const shippedTools = portfolioProjects.filter((study) => Boolean(study.link));

  return (
    <div className="min-h-screen bg-[var(--surface-primary)] page-section">
      <div className="page-shell space-y-10 lg:space-y-12">
        <div className="section-panel px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
          <SectionIntro
            size="lg"
            headingLevel={1}
            title="All projects across product, analytics, and tooling."
            description="A complete index of case studies, live tools, and product experiments across SaaS, fintech, media, and sports data."
            titleClassName="max-w-4xl text-3xl leading-[1.04] sm:text-4xl lg:text-[3.2rem]"
            descriptionClassName="max-w-3xl text-base lg:text-lg"
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="surface-muted px-4 py-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Total projects
              </p>
              <p className="mb-0 text-2xl font-semibold text-[var(--text-primary)]">
                {portfolioProjects.length}
              </p>
            </div>
            <div className="surface-muted px-4 py-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Featured work
              </p>
              <p className="mb-0 text-2xl font-semibold text-[var(--text-primary)]">
                {featuredProjects.length}
              </p>
            </div>
            <div className="surface-muted px-4 py-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Case studies / tools
              </p>
              <p className="mb-0 text-2xl font-semibold text-[var(--text-primary)]">
                {directCaseStudies.length} / {shippedTools.length}
              </p>
            </div>
          </div>
        </div>

        <section aria-label="All projects">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Full project index
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)] lg:text-base">
                The full picture — case studies and live tools together, with featured work marked but not walled off.
              </p>
            </div>
          </div>
          <div className="grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3">
            {portfolioProjects.map((study) => (
              <PortfolioProjectCard
                key={study.slug}
                study={study}
                showFeaturedBadge
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
