import { getPortfolioProjects } from "@/constants/caseStudies";
import {
  constructMetadata,
  generateBreadcrumbStructuredData,
} from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { Catalog97Portfolio } from "@/components/catalog97/Catalog97Portfolio";
import { AIStructuredData } from "@/components/AIStructuredData";

export const metadata = constructMetadata({
  title: "Isaac Vazquez Projects | AI, Fintech and Analytics",
  description:
    "The projects I've shipped across AI workflows, fintech, analytics, civic tech, and sports data, with the product decisions behind them.",
  canonicalUrl: "/portfolio",
  dateModified: "2026-08-09",
});

export default function PortfolioPage() {
  const portfolioProjects = getPortfolioProjects();
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Projects", url: "/portfolio" },
  ];

  return (
    <>
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (
            generateBreadcrumbStructuredData(breadcrumbs) as {
              itemListElement: object[];
            }
          ).itemListElement,
        }}
      />
      <AIStructuredData
        schema={{
          type: "ItemList",
          data: {
            name: "Isaac Vazquez Projects",
            description:
              "Product, analytics, fintech, sports, and decision-support tools built by Isaac Vazquez.",
            url: "https://isaacvazquez.com/portfolio",
            items: portfolioProjects.map((project) => ({
              name: project.title,
              description: project.overview.summary,
              url: project.link?.startsWith("http")
                ? project.link
                : `https://isaacvazquez.com${
                    project.link || `/portfolio/${project.slug}`
                  }`,
            })),
          },
        }}
      />
      <Catalog97Portfolio projects={portfolioProjects} />
    </>
  );
}
