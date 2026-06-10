import type {
  GitHubTrendingRepository,
  GitHubTrendingSegment,
  GitHubTrendingSegmentKind,
  GitHubTrendingSnapshot,
  GitHubTrendingStarPoint,
  GitHubTrendingStarStatus,
} from "@/types/githubTrending";

export interface GitHubTrendingSourceRepository {
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
}

export interface GitHubTrendingSourceSegment {
  key: string;
  label: string;
  kind: GitHubTrendingSegmentKind;
  query: string;
  sourceUrl: string;
  repositories: GitHubTrendingSourceRepository[];
}

export interface BuildGitHubTrendingSnapshotInput {
  generatedAt: string;
  windowDays: number;
  activityWindowDays: number;
  sourceLabel: string;
  sourceUrl: string;
  segments: GitHubTrendingSourceSegment[];
  previousSnapshot?: GitHubTrendingSnapshot | null;
}

const MAX_HISTORY_DAYS = 21;

export function toUtcDateKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetween(startDateKey: string, endDateKey: string): number {
  const start = new Date(`${startDateKey}T00:00:00.000Z`).getTime();
  const end = new Date(`${endDateKey}T00:00:00.000Z`).getTime();
  return Math.floor((end - start) / 86_400_000);
}

function sortHistory(history: GitHubTrendingStarPoint[]): GitHubTrendingStarPoint[] {
  return [...history].sort((a, b) => a.date.localeCompare(b.date));
}

function mergeStarHistory(
  previousHistory: GitHubTrendingStarPoint[] | undefined,
  stars: number,
  generatedAt: string
): GitHubTrendingStarPoint[] {
  const today = toUtcDateKey(generatedAt);
  const byDate = new Map<string, GitHubTrendingStarPoint>();

  for (const point of previousHistory ?? []) {
    byDate.set(point.date, point);
  }
  byDate.set(today, { date: today, stars });

  const minDate = addDays(today, -MAX_HISTORY_DAYS);
  return sortHistory(Array.from(byDate.values())).filter(
    (point) => point.date >= minDate
  );
}

export function calculateWeeklyStars(
  history: GitHubTrendingStarPoint[],
  currentStars: number,
  generatedAt: string,
  windowDays: number
): {
  weeklyStars: number;
  status: GitHubTrendingStarStatus;
  baselineDate: string | null;
} {
  const today = toUtcDateKey(generatedAt);
  const targetDate = addDays(today, -windowDays);
  const ordered = sortHistory(history).filter((point) => point.date <= today);
  const measuredBaseline = [...ordered]
    .reverse()
    .find((point) => point.date <= targetDate);

  if (measuredBaseline) {
    return {
      weeklyStars: Math.max(0, currentStars - measuredBaseline.stars),
      status: "measured",
      baselineDate: measuredBaseline.date,
    };
  }

  const earliest = ordered[0];
  if (!earliest || earliest.date === today) {
    return {
      weeklyStars: 0,
      status: "baseline",
      baselineDate: earliest?.date ?? null,
    };
  }

  return {
    weeklyStars: Math.max(0, currentStars - earliest.stars),
    status: daysBetween(earliest.date, today) >= windowDays ? "measured" : "partial",
    baselineDate: earliest.date,
  };
}

function calculateTrendScore(
  repo: GitHubTrendingRepository,
  generatedAt: string
): number {
  const starScale = Math.log10(repo.stars + 1) * 18;
  const forkScale = Math.log10(repo.forks + 1) * 4;
  const weeklyScale = repo.weeklyStars * 9;
  const pushedAgeDays = Math.max(
    0,
    (new Date(generatedAt).getTime() - new Date(repo.pushedAt).getTime()) /
      86_400_000
  );
  const recencyScale = Math.max(0, 20 - pushedAgeDays / 3);
  const matchScale = repo.matchedSegments.length * 2;

  return Math.round((weeklyScale + starScale + forkScale + recencyScale + matchScale) * 10) / 10;
}

function buildSegment(
  sourceSegment: GitHubTrendingSourceSegment,
  repoById: Map<number, GitHubTrendingRepository>
): GitHubTrendingSegment {
  const repos = sourceSegment.repositories
    .map((repo) => repoById.get(repo.id))
    .filter((repo): repo is GitHubTrendingRepository => Boolean(repo))
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, 12);

  return {
    key: sourceSegment.key,
    label: sourceSegment.label,
    kind: sourceSegment.kind,
    query: sourceSegment.query,
    sourceUrl: sourceSegment.sourceUrl,
    repoIds: repos.map((repo) => repo.id),
    repoCount: repos.length,
    totalStars: repos.reduce((sum, repo) => sum + repo.stars, 0),
    weeklyStars: repos.reduce((sum, repo) => sum + repo.weeklyStars, 0),
    topRepoId: repos[0]?.id ?? null,
  };
}

export function buildGitHubTrendingSnapshot({
  generatedAt,
  windowDays,
  activityWindowDays,
  sourceLabel,
  sourceUrl,
  segments,
  previousSnapshot,
}: BuildGitHubTrendingSnapshotInput): GitHubTrendingSnapshot {
  const previousById = new Map(
    (previousSnapshot?.repositories ?? []).map((repo) => [repo.id, repo])
  );
  const repoById = new Map<number, GitHubTrendingRepository>();

  for (const segment of segments) {
    for (const sourceRepo of segment.repositories) {
      const existing = repoById.get(sourceRepo.id);
      if (existing) {
        existing.matchedSegments = Array.from(
          new Set([...existing.matchedSegments, segment.key])
        ).sort();
        continue;
      }

      const previous = previousById.get(sourceRepo.id);
      const starHistory = mergeStarHistory(
        previous?.starHistory,
        sourceRepo.stars,
        generatedAt
      );
      const weekly = calculateWeeklyStars(
        starHistory,
        sourceRepo.stars,
        generatedAt,
        windowDays
      );
      const repo: GitHubTrendingRepository = {
        ...sourceRepo,
        weeklyStars: weekly.weeklyStars,
        weeklyStarsStatus: weekly.status,
        weeklyStarsBaselineDate: weekly.baselineDate,
        starHistory,
        matchedSegments: [segment.key],
        trendScore: 0,
      };
      repoById.set(repo.id, repo);
    }
  }

  for (const repo of Array.from(repoById.values())) {
    repo.trendScore = calculateTrendScore(repo, generatedAt);
  }

  const languages = segments
    .filter((segment) => segment.kind === "language")
    .map((segment) => buildSegment(segment, repoById))
    .filter((segment) => segment.repoCount > 0);
  const topics = segments
    .filter((segment) => segment.kind === "topic")
    .map((segment) => buildSegment(segment, repoById))
    .filter((segment) => segment.repoCount > 0);

  const repositories = Array.from(repoById.values()).sort((a, b) => {
    if (b.weeklyStars !== a.weeklyStars) {
      return b.weeklyStars - a.weeklyStars;
    }
    if (b.trendScore !== a.trendScore) {
      return b.trendScore - a.trendScore;
    }
    return b.stars - a.stars;
  });

  const totals = {
    repositories: repositories.length,
    languages: languages.length,
    topics: topics.length,
    totalStars: repositories.reduce((sum, repo) => sum + repo.stars, 0),
    weeklyStars: repositories.reduce((sum, repo) => sum + repo.weeklyStars, 0),
    measuredWeeklyDeltaCount: repositories.filter(
      (repo) => repo.weeklyStarsStatus === "measured"
    ).length,
    partialWeeklyDeltaCount: repositories.filter(
      (repo) => repo.weeklyStarsStatus === "partial"
    ).length,
    baselineCount: repositories.filter(
      (repo) => repo.weeklyStarsStatus === "baseline"
    ).length,
  };

  return {
    generatedAt,
    windowDays,
    activityWindowDays,
    sourceLabel,
    sourceUrl,
    repositories,
    languages,
    topics,
    totals,
  };
}

export function sortGitHubTrendingRepositories<
  T extends Pick<
    GitHubTrendingRepository,
    "stars" | "weeklyStars" | "pushedAt" | "trendScore"
  >,
>(repositories: T[], sortKey: "momentum" | "stars" | "updated"): T[] {
  const sorted = [...repositories];
  sorted.sort((a, b) => {
    if (sortKey === "stars") {
      return b.stars - a.stars || b.weeklyStars - a.weeklyStars;
    }
    if (sortKey === "updated") {
      return (
        new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime() ||
        b.weeklyStars - a.weeklyStars
      );
    }
    return b.weeklyStars - a.weeklyStars || b.trendScore - a.trendScore;
  });
  return sorted;
}

export function formatGitHubCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 10_000 ? 1 : 0,
  }).format(value);
}
