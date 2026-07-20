import { StructuredData } from "@/components/StructuredData";
import { golfSnapshot } from "@/data/golfSnapshot";
import { getGolfPlayerSnapshot, getGolfSummary } from "@/lib/golfSnapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { GolfClient } from "./golf-client";
import { normalizeGolfState } from "./golf-state";

export const metadata = constructMetadata({
  title: "PGA Tour Pulse",
  description:
    "Snapshot-backed PGA Tour tournament dashboard for leaderboard scanning, player drilldowns, round-by-round movement, and weekend cut-line context.",
  canonicalUrl: "/golf",
  image: "/golf/opengraph-image",
  dateModified: golfSnapshot.summary.tournament?.generatedAt?.slice(0, 10),
});

interface GolfPageProps {
  searchParams: Promise<{
    view?: string;
    player?: string;
  }>;
}

export default async function GolfPage({ searchParams }: GolfPageProps) {
  const initialState = normalizeGolfState(await searchParams);
  const summary = await getGolfSummary();
  const defaultPlayerId = summary.leaderboard[0]?.playerId ?? null;
  const validPlayerIds = new Set(summary.players.map((player) => player.id));
  const selectedPlayerId = validPlayerIds.has(initialState.player ?? "")
    ? initialState.player
    : defaultPlayerId;
  const initialPlayerSnapshot = selectedPlayerId
    ? await getGolfPlayerSnapshot(selectedPlayerId).catch(() => null)
    : null;
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "PGA Tour Pulse", url: "/golf" },
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
          name: "PGA Tour Pulse",
          description:
            "Snapshot-backed PGA Tour tournament dashboard for leaderboard scanning, player drilldowns, and round-by-round movement.",
          url: "https://isaacavazquez.com/golf",
          applicationCategory: "SportsApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Leaderboard and player-card views backed by shareable URL state",
            "Selected golfer detail with round-by-round scoring and movement",
            "Tournament context for course, dates, field size, and cut line",
            "Local snapshot rendering without a live third-party runtime dependency",
          ],
          dateModified: golfSnapshot.summary.tournament?.generatedAt ?? "",
        }}
      />
      <GolfClient
        initialState={initialState}
        summary={summary}
        initialPlayerSnapshot={initialPlayerSnapshot}
      />
    </>
  );
}
