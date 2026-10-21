import { getPortfolioProjects } from "@/constants/caseStudies";
import {
  constructMetadata,
  generateBreadcrumbStructuredData,
} from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import {
  Catalog97Portfolio,
  WORK_LEAD_COUNT,
} from "@/components/catalog97/Catalog97Portfolio";
import { AIStructuredData } from "@/components/AIStructuredData";

export const metadata = constructMetadata({
  title: "Isaac Vazquez Work | AI, Fintech and Analytics",
  description:
    "The four projects I'd show first and the two jobs the product work came from, with the decisions behind them.",
  canonicalUrl: "/portfolio",
  dateModified: "2026-10-19",
});

export default function PortfolioPage() {
  const portfolioProjects = getPortfolioProjects();
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Work", url: "/portfolio" },
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
            name: "Isaac Vazquez Work",
            description:
              "Product, analytics, fintech, sports, and decision-support tools built by Isaac Vazquez.",
            url: "https://isaacvazquez.com/portfolio",
            items: portfolioProjects.slice(0, WORK_LEAD_COUNT).map((project) => ({
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
