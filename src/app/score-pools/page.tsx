import { StructuredData } from "@/components/StructuredData";
import { scorePoolsSnapshot } from "@/data/scorePoolsSnapshot";
import { getScorePoolsSnapshotData } from "@/lib/scorePoolsSnapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { ScorePoolsClient } from "./score-pools-client";

export const metadata = constructMetadata({
  title: "Score Pools",
  description:
    "Exact-score prediction engine for pool play, with market-calibrated scoreline distributions, expected-points pick rankings, and leaderboard-aware recommendations from a checked-in odds snapshot.",
  canonicalUrl: "/score-pools",
  dateModified: scorePoolsSnapshot.generatedAt.slice(0, 10),
  aiMetadata: {
    profession: "Product Manager",
    specialty:
      "Sports prediction modeling, market-calibrated probability engines, and decision-support tools",
    expertise: [
      "Next.js",
      "Probability modeling",
      "Sports betting markets",
      "Expected-value optimization",
      "Snapshot-driven data products",
    ],
    industry: ["Sports", "Analytics"],
    topics: [
      "exact score prediction",
      "prediction pools",
      "Dixon-Coles model",
      "expected points optimization",
      "odds de-vigging",
    ],
    contentType: "Software Application",
    context:
      "Standalone prediction-pool tool by Isaac Vazquez that turns de-vigged market odds into a calibrated scoreline distribution and standing-aware pick recommendations.",
    summary:
      "Pick sheet for exact-score pools: market-anchored scoreline model, expected-points optimizer, and leaderboard-aware recommendations.",
    primaryFocus:
      "Turning live odds into defensible exact-score picks under configurable pool scoring rules",
  },
});

interface ScorePoolsPageProps {
  searchParams: Promise<{ fixture?: string }>;
}

export default async function ScorePoolsPage({ searchParams }: ScorePoolsPageProps) {
  const { fixture } = await searchParams;
  const snapshot = getScorePoolsSnapshotData();
  const validFixture =
    typeof fixture === "string" &&
    snapshot.leagues.some((league) => league.fixtures.some((entry) => entry.id === fixture))
      ? fixture
      : null;
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Score Pools", url: "/score-pools" },
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
          name: "Score Pools",
          description:
            "Exact-score prediction engine for pool play: de-vigged odds, a market-calibrated scoreline distribution, and expected-points pick rankings under configurable scoring rules.",
          url: "https://isaacavazquez.com/score-pools",
          applicationCategory: "SportsApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Odds normalization and de-vigging for two-way and three-way markets",
            "Dixon-Coles scoreline distribution calibrated to the moneyline and totals",
            "Expected-points optimizer under configurable pool scoring rules",
            "Leaderboard-aware recommendations with protect and chase postures",
            "Timestamped odds history with line-movement summaries",
          ],
        }}
      />
      <ScorePoolsClient snapshot={snapshot} initialFixtureId={validFixture} />
    </>
  );
}
