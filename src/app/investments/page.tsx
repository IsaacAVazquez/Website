import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { InvestmentsClient } from "./investments-client";
import { normalizeInvestmentsState } from "./investments-state";

export const metadata = constructMetadata({
  title: "Investment Research Platform | Isaac Vazquez",
  description:
    "Investment research workspace with curated company snapshots, valuation metrics, financial statements, price history, and browser-saved portfolio tracking.",
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
      "Public investment research workspace for exploring snapshot-backed company analysis and portfolio tracking.",
    summary:
      "Investment research workspace for snapshot-backed company analysis, valuation review, and portfolio tracking.",
    primaryFocus:
      "Investment research workflows, analytics UX, and data-driven decision support",
  },
});

interface InvestmentsPageProps {
  searchParams: Promise<{
    view?: string;
    symbol?: string;
    section?: string;
  }>;
}

export default async function InvestmentsPage({ searchParams }: InvestmentsPageProps) {
  const initialState = normalizeInvestmentsState(await searchParams);
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
            "Investment research workspace for valuation review, financial statements, curated company snapshots, and browser-saved portfolio tracking.",
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
      <InvestmentsClient initialState={initialState} />
    </>
  );
}
