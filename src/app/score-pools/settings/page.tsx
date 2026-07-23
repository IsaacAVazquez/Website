import { StructuredData } from "@/components/StructuredData";
import { scorePoolsSnapshot } from "@/data/scorePoolsSnapshot";
import { getScorePoolsSnapshotData } from "@/lib/scorePoolsSnapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { getScorePoolsModifiedDate } from "../score-pools-metadata";
import { SettingsClient } from "./settings-client";

export const metadata = constructMetadata({
  title: "Score Pools Settings",
  description:
    "Configuration for the score-pools engine: scoring rules with the 90-minute or final-result basis, leaderboard standing and posture, field model, rivals, and data status.",
  canonicalUrl: "/score-pools/settings",
  dateModified: getScorePoolsModifiedDate(scorePoolsSnapshot.generatedAt),
});

export default function ScorePoolsSettingsPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Score Pools", url: "/score-pools" },
    { name: "Settings", url: "/score-pools/settings" },
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
          title: "Score Pools Settings",
          description:
            "Configuration for exact-score pool scoring rules, result basis, leaderboard posture, field model, rivals, and data status.",
          url: "https://isaacavazquez.com/score-pools/settings",
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
      <SettingsClient snapshot={getScorePoolsSnapshotData()} />
    </>
  );
}
