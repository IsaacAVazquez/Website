import { StructuredData } from "@/components/StructuredData";
import { premierLeagueSnapshot } from "@/data/premierLeagueSnapshot";
import {
  getPremierLeagueSummary,
  getPremierLeagueTeamSnapshot,
} from "@/lib/premierLeagueSnapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { PremierLeagueClient } from "./premier-league-client";
import { normalizePremierLeagueState } from "./premier-league-state";

export const metadata = constructMetadata({
  title: "Premier League Pulse",
  description:
    "Premier League dashboard with standings, recent and upcoming fixtures, and club-level drilldowns backed by a checked-in snapshot.",
  canonicalUrl: "/premier-league",
  dateModified: premierLeagueSnapshot.summary.generatedAt.slice(0, 10),
});

interface PremierLeaguePageProps {
  searchParams: Promise<{
    view?: string;
    team?: string;
  }>;
}

export default async function PremierLeaguePage({ searchParams }: PremierLeaguePageProps) {
  const initialState = normalizePremierLeagueState(await searchParams);
  const summary = await getPremierLeagueSummary();
  const validTeamIds = new Set(summary.teams.map((team) => team.id));
  const selectedTeamId = validTeamIds.has(initialState.team ?? "")
    ? initialState.team
    : summary.standings[0]?.team.id ?? null;
  const initialTeamSnapshot = selectedTeamId
    ? await getPremierLeagueTeamSnapshot(selectedTeamId).catch(() => null)
    : null;
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Premier League Pulse", url: "/premier-league" },
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
          name: "Premier League Pulse",
          description:
            "Premier League dashboard with standings, fixture tracking, and club-level form drilldowns backed by a checked-in snapshot.",
          url: "https://isaacavazquez.com/premier-league",
          applicationCategory: "SportsApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Deep-linkable overview, fixtures, and club views",
            "League standings with quick club drilldowns",
            "Recent and upcoming fixture tracking",
            "Club form summaries backed by a checked-in snapshot",
          ],
        }}
      />
      <PremierLeagueClient
        initialState={initialState}
        summary={summary}
        initialTeamSnapshot={initialTeamSnapshot}
      />
    </>
  );
}
