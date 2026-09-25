"use client";

import type { GitHubTrendingClientRepository } from "@/types/githubTrending";
import { formatGitHubCompactNumber } from "@/lib/githubTrending";
import { languageShares, starBars, type StarLogRepo } from "./star-log";

interface StarLogBoardProps {
  /** The current filter's repositories, sorted by weekly star delta and
   * capped to the top 12 for the board. `RepositoryTable` below still lists
   * every repository in the filter for sorting and searching. */
  repos: GitHubTrendingClientRepository[];
  windowDays: number;
}

const CHART_TOKENS = [
  "var(--c97-chart-1)",
  "var(--c97-chart-2)",
  "var(--c97-chart-3)",
  "var(--c97-chart-4)",
  "var(--c97-chart-5)",
  "var(--c97-chart-6)",
];

function toLogRepo(repo: GitHubTrendingClientRepository): StarLogRepo {
  return {
    id: repo.id,
    fullName: repo.fullName,
    weeklyStars: repo.weeklyStars,
    language: repo.primaryLanguage,
    weeklyStarsStatus: repo.weeklyStarsStatus,
  };
}

/**
 * The page's signature, a git log --stat style board. Each tracked
 * repository's weekly star delta becomes a bar, solid when the window is
 * fully measured, hatched when it's partial, and outlined when the snapshot
 * only has a baseline. A language strip on top shows how the week's stars
 * split across languages.
 */
export function StarLogBoard({ repos, windowDays }: StarLogBoardProps) {
  if (repos.length === 0) {
    return <p className="c97-meta">No repositories in this filter yet.</p>;
  }

  const board = [...repos].sort((a, b) => b.weeklyStars - a.weeklyStars).slice(0, 12);
  const bars = new Map(starBars(board.map(toLogRepo)).map((bar) => [bar.id, bar]));
  const languages = languageShares(repos.map(toLogRepo));
  const leader = languages[0];

  return (
    <div className="c97-star-log">
      {languages.length > 0 ? (
        <div
          className="c97-star-log-strip"
          role="img"
          aria-label={`This week's stars by language. ${languages
            .map((entry) => `${entry.language} ${Math.round(entry.share * 100)}%`)
            .join(", ")}.`}
        >
          {languages.map((entry, index) => (
            <div
              key={entry.language}
              className="c97-star-log-strip-segment"
              style={{ width: `${entry.share * 100}%` }}
            >
              <span
                className="c97-star-log-strip-swatch"
                style={{ background: CHART_TOKENS[index % CHART_TOKENS.length] }}
              />
              {entry.share >= 0.08 ? (
                <span className="c97-star-log-strip-label">{entry.language}</span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <ol className="c97-star-log-rows" aria-label={`Weekly star movement, led by ${leader?.language ?? "no language"}`}>
        {board.map((repo) => {
          const bar = bars.get(String(repo.id));
          const status = repo.weeklyStarsStatus;
          const displayShare = status === "baseline" ? 0.06 : bar?.share ?? 0;
          return (
            <li key={repo.id} className="c97-star-log-row">
              <span className="c97-mono c97-star-log-delta">
                {status === "baseline"
                  ? "Baseline"
                  : `${repo.weeklyStars >= 0 ? "+" : ""}${formatGitHubCompactNumber(repo.weeklyStars)}`}
              </span>
              <span className="c97-star-log-bar-track">
                <span
                  className="c97-star-log-bar"
                  data-status={status}
                  style={{ width: `${Math.max(displayShare, 0) * 100}%` }}
                />
              </span>
              <a
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                className="c97-serif c97-star-log-name"
              >
                {repo.fullName}
              </a>
              <span className="c97-mono c97-star-log-total">
                {formatGitHubCompactNumber(repo.stars)}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="c97-star-log-legend">
        <span>
          <span className="c97-star-log-swatch" data-status="measured" aria-hidden="true" />
          {windowDays}d measured
        </span>
        <span>
          <span className="c97-star-log-swatch" data-status="partial" aria-hidden="true" />
          Partial window
        </span>
        <span>
          <span className="c97-star-log-swatch" data-status="baseline" aria-hidden="true" />
          New baseline
        </span>
      </div>
    </div>
  );
}
