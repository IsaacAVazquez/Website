import { getPortfolioProjects } from "@/constants/caseStudies";
import { constructMetadata } from "@/lib/seo";
import { PortfolioProjectCard } from "@/components/PortfolioProjectCard";

export const metadata = constructMetadata({
  title: "Projects",
  description:
    "All projects across product strategy, analytics, platform reliability, and investment research tooling.",
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
      "Complete portfolio of product management projects by Isaac Vazquez, covering live tools, analytics products, reliability work, and professional case studies.",
    summary:
      "All projects demonstrating product management experience across platform scale, analytics, and investment research tooling.",
  },
});

export default function PortfolioPage() {
  const portfolioProjects = getPortfolioProjects();

  return (
    <section
      className="home-page min-h-screen"
      aria-labelledby="portfolio-heading"
    >
      <div className="home-shell home-section space-y-10">
        {/* Page heading */}
        <div className="space-y-3 pt-4">
          <p className="home-kicker">Projects</p>
          <h1
            id="portfolio-heading"
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
            All projects across product, analytics, and tooling.
          </h1>
        </div>

        {/* Intro + grid */}
        <section className="space-y-8" aria-label="All projects">
          <div className="grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3">
            {portfolioProjects.map((study) => (
              <PortfolioProjectCard key={study.slug} study={study} />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
