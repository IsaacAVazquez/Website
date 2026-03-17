import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { InvestmentsClient } from "./investments-client";

export const metadata = constructMetadata({
  title: "Investment Research Platform | Isaac Vazquez",
  description:
    "Public investment research platform built by Isaac Vazquez. Explore portfolio analytics, curated ticker research snapshots, valuation metrics, financial statements, and structured equity research workflows.",
  canonicalUrl: "/investments",
  dateModified: "2026-03-16",
  aiMetadata: {
    profession: "Product Manager",
    specialty: "Investment research tooling, analytics UX, and fintech product thinking",
    expertise: [
      "Fintech Product Strategy",
      "Investment Research Workflows",
      "Data Visualization",
      "Financial Analysis Interfaces",
      "Next.js",
    ],
    industry: ["Fintech", "Wealth Tech", "SaaS"],
    topics: [
      "Investment Research Platform",
      "Portfolio Analytics",
      "Equity Analysis",
      "Financial Statements",
    ],
    contentType: "Software Application",
    context:
      "Recruiter-facing fintech project showcasing Isaac Vazquez's product thinking through a public investment research platform.",
    summary:
      "Investment research workspace for portfolio analytics, valuation, financial statement review, and curated equity analysis.",
    primaryFocus:
      "Fintech product execution, investment research UX, and data-driven decision support",
  },
});

export default function InvestmentsPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Investments", url: "/investments" },
  ];

  return (
    <>
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (generateBreadcrumbStructuredData(breadcrumbs) as { itemListElement: object[] }).itemListElement,
        }}
      />
      <StructuredData
        type="SoftwareApplication"
        data={{
          name: "Investment Research Platform",
          description:
            "Public investment research platform for portfolio analytics, valuation review, financial statements, and curated ticker snapshots.",
          url: "https://isaacavazquez.com/investments",
          applicationCategory: "FinanceApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          author: "Isaac Vazquez",
          keywords: [
            "investment research",
            "fintech product",
            "portfolio analytics",
            "equity research",
          ],
        }}
      />
      <InvestmentsClient />
    </>
  );
}
