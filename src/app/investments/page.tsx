import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { getInvestmentsIndex } from "@/lib/investmentsData";
import type { InvestmentsIndex } from "@/types/investment";
import investmentsIndex from "../../../public/data/investments/index.json";
import { InvestmentsClient } from "./investments-client";
import { normalizeInvestmentsState } from "./investments-state";

export const metadata = constructMetadata({
  title: "Investment Research Platform",
  description:
    "Investment research workspace with curated company snapshots, valuation metrics, financial statements, price history, and browser-saved portfolio tracking.",
  canonicalUrl: "/investments",
  dateModified: investmentsIndex.lastUpdated.slice(0, 10),
  image: "/investments/opengraph-image",
});

interface InvestmentsPageProps {
  searchParams: Promise<{
    view?: string;
    symbol?: string;
    section?: string;
  }>;
}

async function loadIndexSafely(): Promise<InvestmentsIndex | null> {
  try {
    return await getInvestmentsIndex();
  } catch {
    return null;
  }
}

export default async function InvestmentsPage({ searchParams }: InvestmentsPageProps) {
  const [initialState, index] = await Promise.all([
    Promise.resolve(normalizeInvestmentsState(await searchParams)),
    loadIndexSafely(),
  ]);
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
          image: "https://isaacavazquez.com/investments/opengraph-image",
          ...(index?.lastUpdated
            ? { dateModified: index.lastUpdated }
            : {}),
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
      <InvestmentsClient
        initialState={initialState}
        datasetLastUpdated={index?.lastUpdated ?? null}
        datasetSymbolCount={index?.symbols?.length ?? 0}
        datasetFreshCount={
          index?.freshCount ?? index?.entries?.filter((entry) => !entry.stale).length ?? 0
        }
        datasetStaleCount={
          index?.staleCount ?? index?.entries?.filter((entry) => entry.stale).length ?? 0
        }
        datasetFailedCount={index?.failed?.length ?? 0}
        datasetPriceHealth={index?.priceHealth ?? null}
      />
    </>
  );
}
