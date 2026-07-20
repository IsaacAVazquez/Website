import { scorePoolsSnapshot } from "@/data/scorePoolsSnapshot";
import { getScorePoolsSnapshotData } from "@/lib/scorePoolsSnapshot";
import { constructMetadata } from "@/lib/seo";
import { SettingsClient } from "./settings-client";

export const metadata = constructMetadata({
  title: "Score Pools Settings",
  description:
    "Configuration for the score-pools engine: scoring rules with the 90-minute or final-result basis, leaderboard standing and posture, field model, rivals, and data status.",
  canonicalUrl: "/score-pools/settings",
  dateModified: scorePoolsSnapshot.generatedAt.slice(0, 10),
});

export default function ScorePoolsSettingsPage() {
  return <SettingsClient snapshot={getScorePoolsSnapshotData()} />;
}
