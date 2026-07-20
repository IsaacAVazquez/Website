import { scorePoolsSnapshot } from "@/data/scorePoolsSnapshot";
import { getScorePoolsSnapshotData } from "@/lib/scorePoolsSnapshot";
import { constructMetadata } from "@/lib/seo";
import { TrackerClient } from "./tracker-client";

export const metadata = constructMetadata({
  title: "Score Pools Tracker",
  description:
    "Running score tracker for exact-score prediction pools: submitted picks scored against results under configurable rules, cumulative totals, and rival comparisons.",
  canonicalUrl: "/score-pools/tracker",
  dateModified: scorePoolsSnapshot.generatedAt.slice(0, 10),
});

export default function ScorePoolsTrackerPage() {
  return <TrackerClient snapshot={getScorePoolsSnapshotData()} />;
}
