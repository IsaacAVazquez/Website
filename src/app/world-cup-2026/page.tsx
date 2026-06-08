import { StructuredData } from "@/components/StructuredData";
import { worldCupSnapshot } from "@/data/worldCupSnapshot";
import {
  getWorldCupSummarySnapshot,
  getWorldCupTeamSnapshot,
} from "@/lib/worldCupSnapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { WorldCupClient } from "./world-cup-client";
import { normalizeWorldCupState } from "./world-cup-state";

export const metadata = constructMetadata({
  title: "World Cup Pulse",
  description:
    "Interactive 2026 FIFA World Cup dashboard with group standings, the expanded 32-team knockout bracket, the full match schedule across the United States, Canada, and Mexico, and host venue context.",
  canonicalUrl: "/world-cup-2026",
  image: "/world-cup-2026/opengraph-image",
  dateModified: worldCupSnapshot.tournament.generatedAt.slice(0, 10),
  aiMetadata: {
    profession: "Product Manager",
    specialty:
      "Interactive dashboards, sports data products, and productized exploratory tools",
    expertise: [
      "Next.js",
      "Sports dashboard design",
      "Deep-linkable UI state",
      "Snapshot-driven data products",
      "Information architecture",
    ],
    industry: ["Sports", "Media", "Analytics"],
    topics: [
      "2026 FIFA World Cup",
      "group standings",
      "knockout bracket",
      "match schedule",
      "host cities",
    ],
    contentType: "Software Application",
    context:
      "Standalone 2026 FIFA World Cup tracker by Isaac Vazquez that packages a curated ESPN snapshot into a deep-linkable dashboard covering groups, the knockout bracket, and the schedule.",
    summary:
      "World Cup dashboard for group standings, the 32-team knockout bracket, the full schedule, and host venues.",
    primaryFocus:
      "Fast local data exploration with shareable URL state across the group stage and knockout rounds",
  },
});

interface WorldCupPageProps {
  searchParams: Promise<{
    view?: string;
    team?: string;
  }>;
}

export default async function WorldCupPage({ searchParams }: WorldCupPageProps) {
  const initialState = normalizeWorldCupState(await searchParams);
  const summary = await getWorldCupSummarySnapshot();
  const initialTeamSnapshot = initialState.team
    ? await getWorldCupTeamSnapshot(initialState.team).catch(() => null)
    : null;
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "World Cup Pulse", url: "/world-cup-2026" },
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
          name: "World Cup Pulse",
          description:
            "Interactive 2026 FIFA World Cup dashboard with group standings, the 32-team knockout bracket, the full match schedule, and host venues, backed by a curated ESPN snapshot.",
          url: "https://isaacavazquez.com/world-cup-2026",
          applicationCategory: "SportsApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Group-stage standings for all 12 groups",
            "Expanded 32-team knockout bracket",
            "Full tournament schedule with deep-linkable state",
            "Host venue context across the United States, Canada, and Mexico",
            "Fast local-first rendering without a live third-party runtime dependency",
          ],
          dateModified: worldCupSnapshot.tournament.generatedAt,
        }}
      />
      <WorldCupClient
        initialState={initialState}
        summary={summary}
        initialTeamSnapshot={initialTeamSnapshot}
      />
    </>
  );
}
