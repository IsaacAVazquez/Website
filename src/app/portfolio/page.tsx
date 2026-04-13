import { getPortfolioProjects } from "@/constants/caseStudies";
import { constructMetadata } from "@/lib/seo";
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

  return (
    <section className="home-page min-h-screen">
      <div className="home-shell home-section space-y-10">
        {/* Page heading */}
        <div className="space-y-3 pt-4">
          <p className="home-kicker">Projects</p>
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
            Product work across fintech, analytics, and civic technology.
          </h1>
        </div>

        {/* Intro + grid */}
        <div className="space-y-8">
          <div className="grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3">
            {portfolioProjects.map((study) => (
              <PortfolioProjectCard
                key={study.slug}
                study={study}
                showFeaturedBadge
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
