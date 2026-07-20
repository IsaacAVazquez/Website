import { StructuredData } from "@/components/StructuredData";
import { pollingSnapshot } from "@/data/pollingSnapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { PollingAggregatorClient } from "./polling-aggregator-client";
import { normalizePollingState } from "./polling-aggregator-state";

export const metadata = constructMetadata({
  title: "Polling Aggregator",
  description:
    "Interactive polling dashboard using VoteHub data for presidential approval and the 2026 generic congressional ballot.",
  canonicalUrl: "/polling-aggregator",
  dateModified: pollingSnapshot.generatedAt.slice(0, 10),
});

interface PollingPageProps {
  searchParams: Promise<{
    view?: string;
    race?: string;
  }>;
}

export default async function PollingAggregatorPage({ searchParams }: PollingPageProps) {
  const initialState = normalizePollingState(await searchParams);
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Polling Aggregator", url: "/polling-aggregator" },
  ];

  return (
    <>
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (generateBreadcrumbStructuredData(breadcrumbs) as { itemListElement: object[] })
            .itemListElement,
        }}
      />
      <StructuredData
        type="SportsApplication"
        data={{
          name: "Polling Aggregator",
          description:
            "Interactive polling dashboard for presidential approval and the 2026 generic ballot using VoteHub data.",
          url: "https://isaacavazquez.com/polling-aggregator",
          applicationCategory: "NewsApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Presidential approval rating trend and poll table",
            "Generic congressional ballot average",
            "VoteHub source attribution and field-date freshness",
            "Deep-linkable overview and approval views",
          ],
        }}
      />
      <PollingAggregatorClient initialState={initialState} snapshot={pollingSnapshot} />
    </>
  );
}
