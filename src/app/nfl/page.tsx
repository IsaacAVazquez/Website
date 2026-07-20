import { StructuredData } from "@/components/StructuredData";
import { nflSnapshot } from "@/data/nflSnapshot";
import { getNflSummarySnapshot, getNflTeamSnapshot } from "@/lib/nflSnapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { NflClient } from "./nfl-client";
import { normalizeNflState } from "./nfl-state";

export const metadata = constructMetadata({
  title: "NFL Pulse",
  description:
    "Interactive NFL dashboard with conference seedings, division leaders, playoff cutoffs, point differential context, and snapshot stat leaders for passing, rushing, receiving, and sacks.",
  canonicalUrl: "/nfl",
  dateModified: nflSnapshot.updatedAt,
});

interface NflPageProps {
  searchParams: Promise<{
    view?: string;
    team?: string;
  }>;
}

export default async function NflPage({ searchParams }: NflPageProps) {
  const initialState = normalizeNflState(await searchParams);
  const summary = await getNflSummarySnapshot();
  const initialTeamSnapshot = await getNflTeamSnapshot(initialState.team).catch(
    () => null
  );
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "NFL Pulse", url: "/nfl" },
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
      <StructuredData
        type="SoftwareApplication"
        data={{
          name: "NFL Pulse",
          description:
            "Interactive NFL standings dashboard with conference, division, playoff, and stat-leader views backed by a curated NFLverse snapshot.",
          url: "https://isaacavazquez.com/nfl",
          applicationCategory: "SportsApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Competition-pressure filters for AFC, NFC, and playoff seeds",
            "Deep-linkable team selection and URL state",
            "Snapshot standings, point differential context, and stat leaders",
            "Fast local-first rendering without a live third-party runtime dependency",
          ],
          dateModified: nflSnapshot.updatedAt,
        }}
      />
      <NflClient
        initialState={initialState}
        summary={summary}
        initialTeamSnapshot={initialTeamSnapshot}
      />
    </>
  );
}
