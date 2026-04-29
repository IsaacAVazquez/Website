import { StructuredData } from "@/components/StructuredData";
import { premierLeagueSnapshot } from "@/data/premierLeagueSnapshot";
import {
  getPremierLeagueSummary,
  getPremierLeagueTeamSnapshot,
} from "@/lib/premierLeagueSnapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { PremierLeagueClient } from "./premier-league-client";
import { normalizePremierLeagueState } from "./premier-league-state";

// eslint-disable-next-line react-refresh/only-export-components -- Next.js route modules export metadata alongside the page component.
export const metadata = constructMetadata({
  title: "Premier League Pulse",
  description:
    "Premier League dashboard with standings, recent and upcoming fixtures, and club-level drilldowns backed by a checked-in snapshot.",
  canonicalUrl: "/premier-league",
  dateModified: premierLeagueSnapshot.summary.generatedAt.slice(0, 10),
  aiMetadata: {
    profession: "Product Manager",
    specialty: "Interactive sports dashboards, snapshot-driven product surfaces, and exploratory data UX",
    expertise: [
      "Next.js",
      "Sports data products",
      "Dashboard design",
      "Snapshot normalization",
      "Deep-linkable UI state",
    ],
    industry: ["Sports", "Media", "Analytics"],
    topics: [
      "Premier League standings",
      "soccer dashboard",
      "fixture tracker",
      "club form explorer",
    ],
    contentType: "Software Application",
    context:
      "Standalone Premier League tool by Isaac Vazquez that packages a checked-in competition snapshot into a deep-linkable product surface.",
    summary:
      "Premier League dashboard for standings, fixtures, and club-level recent-form drilldowns.",
    primaryFocus:
      "Snapshot-driven sports exploration, fast dashboard UX, and shareable league views",
  },
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
