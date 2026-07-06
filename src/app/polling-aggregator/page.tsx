import { StructuredData } from "@/components/StructuredData";
import { pollingSnapshot } from "@/data/pollingSnapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { PollingAggregatorClient } from "./polling-aggregator-client";
import { normalizePollingState } from "./polling-aggregator-state";

export const metadata = constructMetadata({
  title: "Polling Aggregator",
  description:
    "Interactive polling-aggregator dashboard covering presidential approval, the generic congressional ballot, and 2026 Senate and governor races. Currently displays illustrative sample data rather than live polling.",
  canonicalUrl: "/polling-aggregator",
  dateModified: pollingSnapshot.generatedAt.slice(0, 10),
  aiMetadata: {
    profession: "Product Manager",
    specialty: "Data aggregation, political analytics, and interactive dashboard design",
    expertise: [
      "Next.js",
      "Political data products",
      "Dashboard design",
      "Polling aggregation methodology",
      "Deep-linkable UI state",
    ],
    industry: ["Politics", "Media", "Analytics", "Civic Tech"],
    topics: [
      "presidential approval rating",
      "generic ballot polling",
      "2026 midterm elections",
      "Senate race tracker",
      "governor race tracker",
      "polling average",
    ],
    contentType: "Software Application",
    context:
      "Standalone political polling-aggregator dashboard by Isaac Vazquez covering presidential approval, the generic ballot, and 2026 Senate and governor races. It currently renders illustrative sample data to demonstrate the aggregator interface rather than live polling.",
    summary:
      "Polling aggregator dashboard for presidential approval trends, the generic congressional ballot, and competitive 2026 midterm races.",
    primaryFocus:
      "Snapshot-driven political data exploration, polling averages, and shareable race views",
  },
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
            "Interactive polling-aggregator dashboard for presidential approval, the generic ballot, and 2026 midterm races, currently showing illustrative sample data rather than live polling.",
          url: "https://isaacavazquez.com/polling-aggregator",
          applicationCategory: "NewsApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Presidential approval rating trend and poll table",
            "Generic congressional ballot average",
            "2026 Senate race tracker with poll history",
            "2026 Governor race tracker with poll history",
            "Deep-linkable views and race drilldowns",
          ],
        }}
      />
      <PollingAggregatorClient initialState={initialState} snapshot={pollingSnapshot} />
    </>
  );
}
