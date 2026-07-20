import { getPortfolioProjects } from "@/constants/caseStudies";
import { constructMetadata } from "@/lib/seo";
import { PortfolioInstrument } from "@/components/portfolio/PortfolioInstrument";
import { AIStructuredData } from "@/components/AIStructuredData";

export const metadata = constructMetadata({
  title: "Isaac Vazquez Projects | AI, Fintech and Analytics",
  description:
    "The projects I've shipped across AI workflows, fintech, analytics, civic tech, and sports data, with the product decisions behind them.",
  canonicalUrl: "/portfolio",
  dateModified: "2026-07-16",
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
      "Portfolio of product management projects by Isaac Vazquez, covering live tools, analytics products, reliability work, and professional case studies.",
    summary:
      "All projects demonstrating product management experience across platform scale, analytics, and investment research tooling.",
  },
});

export default function PortfolioPage() {
  const portfolioProjects = getPortfolioProjects();

  return (
    <>
      <AIStructuredData
        schema={{
          type: "ItemList",
          data: {
            name: "Isaac Vazquez Projects",
            description:
              "Product, analytics, fintech, sports, and decision-support tools built by Isaac Vazquez.",
            url: "https://isaacavazquez.com/portfolio",
            items: portfolioProjects.map((project) => ({
              name: project.title,
              description: project.overview.summary,
              url: project.link?.startsWith("http")
                ? project.link
                : `https://isaacavazquez.com${
                    project.link || `/portfolio/${project.slug}`
                  }`,
            })),
          },
        }}
      />
      <PortfolioInstrument projects={portfolioProjects} />
    </>
  );
}
