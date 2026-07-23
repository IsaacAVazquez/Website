import { StructuredData } from "@/components/StructuredData";
import { scorePoolsSnapshot } from "@/data/scorePoolsSnapshot";
import { getScorePoolsSnapshotData } from "@/lib/scorePoolsSnapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { getScorePoolsModifiedDate } from "../score-pools-metadata";
import { TrackerClient } from "./tracker-client";

export const metadata = constructMetadata({
  title: "Score Pools Tracker",
  description:
    "Running score tracker for exact-score prediction pools: submitted picks scored against results under configurable rules, cumulative totals, and rival comparisons.",
  canonicalUrl: "/score-pools/tracker",
  dateModified: getScorePoolsModifiedDate(scorePoolsSnapshot.generatedAt),
});

export default function ScorePoolsTrackerPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Score Pools", url: "/score-pools" },
    { name: "Tracker", url: "/score-pools/tracker" },
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
        type="WebPage"
        data={{
          title: "Score Pools Tracker",
          description:
            "Running score tracker for exact-score prediction pools with submitted picks, configurable scoring, cumulative totals, and rival comparisons.",
          url: "https://isaacavazquez.com/score-pools/tracker",
          dateModified: getScorePoolsModifiedDate(
            scorePoolsSnapshot.generatedAt
          ),
          isPartOf: {
            "@type": "SportsApplication",
            "@id": "https://isaacavazquez.com/score-pools#application",
            name: "Score Pools",
            url: "https://isaacavazquez.com/score-pools",
          },
        }}
      />
      <TrackerClient snapshot={getScorePoolsSnapshotData()} />
    </>
  );
}
