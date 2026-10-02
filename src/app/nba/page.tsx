import { StructuredData } from "@/components/StructuredData";
import { nbaSnapshot } from "@/data/nbaSnapshot";
import {
  getNbaSummarySnapshot,
  getNbaTeamSnapshot,
} from "@/lib/nbaSnapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { NbaClient } from "./nba-client";
import { buildTeamAliasMap, normalizeState, resolveDefaultState } from "./nba-state.core";

export const metadata = constructMetadata({
  title: "NBA Pulse",
  description:
    "Interactive NBA dashboard with conference standings, playoff seeding, play-in race context, and snapshot leaderboards for points, rebounds, and assists.",
  canonicalUrl: "/nba",
  dateModified: nbaSnapshot.updatedAt,
});

interface NbaPageProps {
  searchParams: Promise<{
    view?: string;
    team?: string;
  }>;
}

export default async function NbaPage({ searchParams }: NbaPageProps) {
  const { east, west } = nbaSnapshot.teamsByConference;
  const initialState = normalizeState(
    await searchParams,
    resolveDefaultState(east, west),
    buildTeamAliasMap([...east, ...west])
  );
  const summary = await getNbaSummarySnapshot();
  const initialTeamSnapshot = await getNbaTeamSnapshot(initialState.team).catch(() => null);
  // Team colours live only on the per-team snapshots (hex without "#"), not
  // on the lean `summary` the client renders from, so the server builds the
  // small lookup once here.
  const teamColors: Record<string, string | null> = {};
  for (const [teamId, teamSnapshot] of Object.entries(nbaSnapshot.teamSnapshots)) {
    const hex = teamSnapshot.team?.primaryColor ?? null;
    teamColors[teamId] = hex ? `#${hex.replace(/^#/, "")}` : null;
  }
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "NBA Pulse", url: "/nba" },
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
          name: "NBA Pulse",
          description:
            "Interactive NBA standings dashboard with conference, playoff seeding, and play-in views backed by a curated snapshot.",
          url: "https://isaacvazquez.com/nba",
          applicationCategory: "SportsApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Conference and playoff seeding views",
            "Deep-linkable team selection and URL state",
            "Snapshot standings and league leader context",
            "Fast local-first rendering without a live runtime dependency",
          ],
          dateModified: nbaSnapshot.updatedAt,
        }}
      />
      <NbaClient
        initialState={initialState}
        summary={summary}
        initialTeamSnapshot={initialTeamSnapshot}
        teamColors={teamColors}
      />
    </>
  );
}
