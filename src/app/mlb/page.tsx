import { StructuredData } from "@/components/StructuredData";
import { mlbSnapshot } from "@/data/mlbSnapshot";
import { getMlbSummarySnapshot, getMlbTeamSnapshot } from "@/lib/mlbSnapshot";
import { constructMetadata, freeApplicationOffer, generateBreadcrumbStructuredData } from "@/lib/seo";
import { MlbClient } from "./mlb-client";
import { buildTeamAliasMap, normalizeState, resolveDefaultState } from "./mlb-state.core";

export const metadata = constructMetadata({
  title: "MLB Pulse",
  description:
    "Interactive Major League Baseball dashboard with division standings, AL and NL splits, wild card race, recent results, and league-wide hitting and pitching leaders.",
  canonicalUrl: "/mlb",
  dateModified: mlbSnapshot.updatedAt,
});

interface MlbPageProps {
  searchParams: Promise<{
    view?: string;
    team?: string;
  }>;
}

export default async function MlbPage({ searchParams }: MlbPageProps) {
  const initialState = normalizeState(
    await searchParams,
    resolveDefaultState(mlbSnapshot.standings, mlbSnapshot.teams),
    buildTeamAliasMap(mlbSnapshot.teams)
  );
  const summary = await getMlbSummarySnapshot();
  const initialTeamSnapshot = await getMlbTeamSnapshot(initialState.team).catch(() => null);
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "MLB Pulse", url: "/mlb" },
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
          name: "MLB Pulse",
          description:
            "Interactive MLB standings dashboard with division, league, and wild card race views backed by a curated MLB Stats API snapshot.",
          url: "https://isaacvazquez.com/mlb",
          applicationCategory: "SportsApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Competition-pressure filters for AL, NL, and wild card races",
            "Deep-linkable team selection and URL state",
            "Snapshot-driven standings, schedule, and league-leader context",
            "Fast local-first rendering without a live third-party runtime dependency",
          ],
          dateModified: mlbSnapshot.updatedAt,
          offers: freeApplicationOffer,
        }}
      />
      <MlbClient
        initialState={initialState}
        summary={summary}
        initialTeamSnapshot={initialTeamSnapshot}
      />
    </>
  );
}
