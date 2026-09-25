import type { NewsFeedId } from "@/lib/news-pulse-sources";
import type { clusterArticlesByStory, TopicCluster } from "@/lib/news-pulse-utils";

/** `clusterArticlesByStory` doesn't export its return type, so it's derived here. */
export type StoryCluster = ReturnType<typeof clusterArticlesByStory>[number];

export interface CoverageMatrix {
  topics: string[];
  rows: { outlet: NewsFeedId; counts: number[] }[];
  max: number;
}

/** The front page's lead: the story the most outlets carried, ties broken on total count. */
export function leadStory(clusters: StoryCluster[]): StoryCluster | null {
  if (clusters.length === 0) return null;
  return clusters.reduce((lead, cluster) => {
    const leadOutlets = Object.keys(lead.sources).length;
    const clusterOutlets = Object.keys(cluster.sources).length;
    if (clusterOutlets > leadOutlets) return cluster;
    if (clusterOutlets === leadOutlets && cluster.totalCount > lead.totalCount) return cluster;
    return lead;
  });
}

/** Outlets down the side, topics across, each cell the count from `TopicCluster.sources`. */
export function coverageMatrix(topics: TopicCluster[], outlets: NewsFeedId[]): CoverageMatrix {
  let max = 0;
  const rows = outlets.map((outlet) => {
    const counts = topics.map((topic) => {
      const count = topic.sources[outlet] ?? 0;
      if (count > max) max = count;
      return count;
    });
    return { outlet, counts };
  });
  return { topics: topics.map((topic) => topic.topic), rows, max };
}
