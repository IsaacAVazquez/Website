import { getPortfolioProjects } from "@/constants/caseStudies";
import { constructMetadata } from "@/lib/seo";
import { PortfolioV3 } from "@/components/portfolio/PortfolioV3";
import { AIStructuredData } from "@/components/AIStructuredData";

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
      <PortfolioV3 projects={portfolioProjects} />
    </>
  );
}
