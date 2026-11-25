import { StructuredData } from "@/components/StructuredData";
import { laLigaSnapshot } from "@/data/laLigaSnapshot";
import {
  getLaLigaSummarySnapshot,
  getLaLigaTeamSnapshot,
} from "@/lib/laLigaSnapshot";
import { constructMetadata, freeApplicationOffer, generateBreadcrumbStructuredData } from "@/lib/seo";
import { LaLigaClient } from "./la-liga-client";
import {
  buildClubAliasMap,
  filterClubs,
  getDefaultClub,
  normalizeState,
  resolveDefaultState,
} from "./la-liga-state.core";

export const metadata = constructMetadata({
  title: "La Liga Pulse",
  description:
    "Interactive La Liga dashboard with standings, title-race context, European qualification cutoffs, relegation pressure, and leaderboards from a checked-in football-data.org snapshot.",
  canonicalUrl: "/la-liga",
  image: "/la-liga/opengraph-image",
  dateModified: laLigaSnapshot.updatedAt,
});

interface LaLigaPageProps {
  searchParams: Promise<{
    view?: string;
    club?: string;
  }>;
}

export default async function LaLigaPage({ searchParams }: LaLigaPageProps) {
  const defaultState = resolveDefaultState(laLigaSnapshot.clubs);
  const initialState = normalizeState(
    await searchParams,
    defaultState,
    buildClubAliasMap(laLigaSnapshot.teams)
  );
  const summary = await getLaLigaSummarySnapshot();
  // The client selects the view's first club when the linked one sits outside
  // the view, and it files this snapshot under the club it selected.
  const { clubs } = laLigaSnapshot;
  const selectedClubId = filterClubs(clubs, initialState.view).some((club) => club.id === initialState.club)
    ? initialState.club
    : getDefaultClub(clubs, initialState.view, defaultState.club);
  const initialTeamSnapshot = await getLaLigaTeamSnapshot(selectedClubId).catch(() => null);
  // The team snapshots list results newest first; the table reads oldest first.
  const formByClub = Object.fromEntries(
    Object.entries(laLigaSnapshot.teamSnapshots).map(([id, team]) => [
      id,
      team.form.sequence.slice(0, 5).toReversed(),
    ])
  );
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "La Liga Pulse", url: "/la-liga" },
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
          name: "La Liga Pulse",
          description:
            "Interactive La Liga standings dashboard with title-race, European qualification, and relegation views backed by a football-data.org snapshot that refreshes on a schedule.",
          url: "https://isaacvazquez.com/la-liga",
          applicationCategory: "SportsApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Competition-pressure filters for title race, Europe, and relegation",
            "Deep-linkable club selection and URL state",
            "Standings and leaderboards from a checked-in football-data.org snapshot",
            "Fast local-first rendering without a live third-party runtime dependency",
          ],
          dateModified: laLigaSnapshot.updatedAt,
          offers: freeApplicationOffer,
        }}
      />
      <LaLigaClient
        initialState={initialState}
        summary={summary}
        initialTeamSnapshot={initialTeamSnapshot}
        formByClub={formByClub}
      />
    </>
  );
}
