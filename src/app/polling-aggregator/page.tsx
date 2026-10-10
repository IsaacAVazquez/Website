import { StructuredData } from "@/components/StructuredData";
import { pollingSnapshot } from "@/data/pollingSnapshot";
import { getPollingSnapshot } from "@/lib/pollingSnapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { PollingAggregatorClient } from "./polling-aggregator-client";
import { describeStaleSource, isStalePollDate, newestPollDate } from "./polling-aggregator-helpers";
import { normalizePollingState } from "./polling-aggregator-state";

export const metadata = constructMetadata({
  title: "Polling Aggregator",
  description:
    "Interactive polling dashboard using VoteHub data for presidential approval, the 2026 generic congressional ballot, and the 2026 Senate and governor races.",
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
  const snapshot = await getPollingSnapshot();
  const approvalDate = newestPollDate(snapshot.approvalPolls);
  const genericBallotDate = newestPollDate(snapshot.genericBallotPolls);
  const staleSourceNote = describeStaleSource(approvalDate, genericBallotDate);
  // The same 14-day rule as the note, kept per series so each average can carry its own.
  const staleSeries = {
    approval: isStalePollDate(approvalDate),
    genericBallot: isStalePollDate(genericBallotDate),
  };
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
        type="SoftwareApplication"
        data={{
          name: "Polling Aggregator",
          description:
            "Interactive polling dashboard for presidential approval, the 2026 generic ballot, and the 2026 Senate and governor races using VoteHub data.",
          url: "https://isaacvazquez.com/polling-aggregator",
          applicationCategory: "NewsApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Presidential approval rating trend and poll table",
            "Generic congressional ballot average",
            "Senate and governor race averages by state",
            "VoteHub source attribution and field-date freshness",
            "Deep-linkable overview, approval, Senate, and governor views",
          ],
        }}
      />
      <PollingAggregatorClient
        initialState={initialState}
        snapshot={snapshot}
        staleSourceNote={staleSourceNote}
        staleSeries={staleSeries}
      />
    </>
  );
}
