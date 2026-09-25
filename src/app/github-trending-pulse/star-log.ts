import type { GitHubTrendingStarStatus } from "@/types/githubTrending";

/**
 * The repository fields the star log needs. The snapshot's field is named
 * `primaryLanguage`; callers map it onto `language` here since the log
 * doesn't care where the value came from.
 */
export interface StarLogRepo {
  id: string | number;
  fullName: string;
  weeklyStars: number;
  language: string | null;
  weeklyStarsStatus: GitHubTrendingStarStatus;
}

export interface StarBar {
  id: string;
  share: number;
  status: GitHubTrendingStarStatus;
}

const SHARE_FLOOR = 0.02;

/** Each bar's width, scaled to the week's biggest mover. A flat or negative
 * week draws no bar, and a small positive one is floored so it stays visible
 * beside a repository that gained tens of thousands of stars. */
export function starBars(repos: StarLogRepo[]): StarBar[] {
  const max = Math.max(0, ...repos.map((repo) => repo.weeklyStars));
  return repos.map((repo) => ({
    id: String(repo.id),
    status: repo.weeklyStarsStatus,
    share:
      repo.weeklyStars <= 0 || max <= 0
        ? 0
        : Math.max(SHARE_FLOOR, repo.weeklyStars / max),
  }));
}

export interface LanguageShare {
  language: string;
  share: number;
}

/** The week's stars split by primary language, descending. A missing
 * language folds into "Other," and a flat or negative week contributes
 * nothing to the total. */
export function languageShares(repos: StarLogRepo[]): LanguageShare[] {
  const totals = new Map<string, number>();
  for (const repo of repos) {
    if (repo.weeklyStars <= 0) continue;
    const key = repo.language ?? "Other";
    totals.set(key, (totals.get(key) ?? 0) + repo.weeklyStars);
  }
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  if (sum <= 0) return [];
  return [...totals.entries()]
    .map(([language, total]) => ({ language, share: total / sum }))
    .sort((a, b) => b.share - a.share);
}
