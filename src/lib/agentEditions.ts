import type {
  GitHubTrendingSnapshot,
  GitHubTrendingStarStatus,
} from "@/types/githubTrending";
import { getAgentBuildIndex } from "./agentBuildIndex";
import { isRecord } from "./utils";
import { isSourceTime } from "./personalFollowing";

export interface AgentEditionRepository {
  id: number;
  fullName: string;
  rank: number;
  stars: number;
  weeklyStars: number;
  status: GitHubTrendingStarStatus;
}
export interface AgentEdition {
  weekStart: string;
  observedAt: string;
  repositories: AgentEditionRepository[];
}
function utcWeek(value: string) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}
export function readAgentEditions(value: unknown): AgentEdition[] {
  if (!Array.isArray(value)) return [];
  const weeks = new Set<string>();
  return value
    .flatMap((row): AgentEdition[] => {
      if (
        !isRecord(row) ||
        !isSourceTime(row.observedAt) ||
        row.weekStart !== utcWeek(row.observedAt) ||
        typeof row.weekStart !== "string" ||
        weeks.has(row.weekStart) ||
        !Array.isArray(row.repositories) ||
        !row.repositories.length ||
        row.repositories.length > 100
      )
        return [];
      const repositories = row.repositories.flatMap(
        (repo): AgentEditionRepository[] => {
          if (
            !isRecord(repo) ||
            !Number.isSafeInteger(repo.id) ||
            (repo.id as number) <= 0 ||
            typeof repo.fullName !== "string" ||
            !/^[a-zA-Z0-9_.-]{1,100}\/[a-zA-Z0-9_.-]{1,100}$/.test(
              repo.fullName,
            ) ||
            ![repo.rank, repo.stars, repo.weeklyStars].every(
              (n) => typeof n === "number" && Number.isSafeInteger(n),
            ) ||
            (repo.rank as number) < 1 ||
            (repo.stars as number) < 0 ||
            !["measured", "partial", "baseline"].includes(repo.status as string)
          )
            return [];
          return [
            {
              id: repo.id as number,
              fullName: repo.fullName,
              rank: repo.rank as number,
              stars: repo.stars as number,
              weeklyStars: repo.weeklyStars as number,
              status: repo.status as GitHubTrendingStarStatus,
            },
          ];
        },
      );
      if (
        repositories.length !== row.repositories.length ||
        new Set(repositories.map((repo) => repo.id)).size !==
          repositories.length
      )
        return [];
      weeks.add(row.weekStart);
      return [
        { weekStart: row.weekStart, observedAt: row.observedAt, repositories },
      ];
    })
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
    .slice(0, 52);
}

/** Retain the latest successful agent observation per UTC week; never backfill rankings. */
export function updateAgentEditions(
  previous: AgentEdition[],
  snapshot: GitHubTrendingSnapshot,
): AgentEdition[] {
  const clean = readAgentEditions(previous);
  if (
    !isSourceTime(snapshot.generatedAt) ||
    (clean[0] &&
      Date.parse(snapshot.generatedAt) <= Date.parse(clean[0].observedAt)) ||
    snapshot.sourceStatus?.failedSegments.includes("Agents") ||
    snapshot.sourceStatus?.reusedSegments.includes("Agents")
  )
    return clean;
  const index = getAgentBuildIndex(snapshot);
  if (!index.repositories.length) return clean;
  const current = {
    weekStart: utcWeek(snapshot.generatedAt),
    observedAt: snapshot.generatedAt,
    repositories: index.repositories.map((repo, i) => ({
      id: repo.id,
      fullName: repo.fullName,
      rank: i + 1,
      stars: repo.stars,
      weeklyStars: repo.weeklyStars,
      status: repo.weeklyStarsStatus,
    })),
  };
  return readAgentEditions([
    current,
    ...clean.filter((row) => row.weekStart !== current.weekStart),
  ]);
}

export function editionChanges(current: AgentEdition, previous: AgentEdition) {
  return {
    entrants: current.repositories.filter(
      (repo) => !previous.repositories.some((old) => old.id === repo.id),
    ),
    departed: previous.repositories.filter(
      (repo) => !current.repositories.some((next) => next.id === repo.id),
    ),
  };
}
