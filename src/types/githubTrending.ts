export type GitHubTrendingSegmentKind = "language" | "topic";

export type GitHubTrendingSortKey = "momentum" | "stars" | "updated";

export type GitHubTrendingStarStatus = "measured" | "partial" | "baseline";

export interface GitHubTrendingStarPoint {
  date: string;
  stars: number;
}

export interface GitHubTrendingRepository {
  id: number;
  nodeId: string;
  name: string;
  fullName: string;
  owner: string;
  description: string | null;
  url: string;
  homepageUrl: string | null;
  primaryLanguage: string | null;
  topics: string[];
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  licenseSpdxId: string | null;
  pushedAt: string;
  createdAt: string;
  updatedAt: string;
  weeklyStars: number;
  weeklyStarsStatus: GitHubTrendingStarStatus;
  weeklyStarsBaselineDate: string | null;
  starHistory: GitHubTrendingStarPoint[];
  matchedSegments: string[];
  trendScore: number;
}

export interface GitHubTrendingSegment {
  key: string;
  label: string;
  kind: GitHubTrendingSegmentKind;
  query: string;
  sourceUrl: string;
  repoIds: number[];
  repoCount: number;
  totalStars: number;
  weeklyStars: number;
  topRepoId: number | null;
}

export interface GitHubTrendingSnapshotTotals {
  repositories: number;
  languages: number;
  topics: number;
  totalStars: number;
  weeklyStars: number;
  measuredWeeklyDeltaCount: number;
  partialWeeklyDeltaCount: number;
  baselineCount: number;
}

export interface GitHubTrendingSnapshot {
  generatedAt: string;
  windowDays: number;
  activityWindowDays: number;
  sourceLabel: string;
  sourceUrl: string;
  repositories: GitHubTrendingRepository[];
  languages: GitHubTrendingSegment[];
  topics: GitHubTrendingSegment[];
  totals: GitHubTrendingSnapshotTotals;
}

export interface GitHubTrendingRouteState {
  kind: GitHubTrendingSegmentKind;
  segment: string;
  sort: GitHubTrendingSortKey;
  selectedRepoId: number | null;
}
