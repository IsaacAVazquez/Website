"use client";

import { ExternalLink } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { relativeAge } from "@/lib/utils";
import { useClientNow } from "@/hooks/useClientNow";
import {
  formatGitHubCompactNumber,
  sortGitHubTrendingRepositories,
} from "@/lib/githubTrending";
import type {
  GitHubTrendingClientRepository,
  GitHubTrendingRouteState,
  GitHubTrendingSegment,
  GitHubTrendingSegmentKind,
  GitHubTrendingClientSnapshot,
  GitHubTrendingSortKey,
} from "@/types/githubTrending";
import {
  buildGitHubTrendingHref,
  GITHUB_TRENDING_KIND_LABELS,
  GITHUB_TRENDING_KIND_OPTIONS,
  GITHUB_TRENDING_SORT_LABELS,
  GITHUB_TRENDING_SORT_OPTIONS,
  normalizeGitHubTrendingState,
  resolveGitHubTrendingState,
} from "./github-trending-state";
import { languageShares, starBars, type StarLogRepo } from "./star-log";
import { SHORT_DATE_FORMATTER, DATE_ONLY_TIME_ZONE, formatDateTime } from "@/lib/date-formatters";
import "./github-trending-pulse.css";
import { useRouteSync } from "@/hooks/useRouteSync";

interface GitHubTrendingClientProps {
  initialState: GitHubTrendingRouteState;
  snapshot: GitHubTrendingClientSnapshot;
}

// weeklyStarsBaselineDate is a bare "YYYY-MM-DD" key (UTC midnight), never an
// instant, so it formats in UTC rather than the display zone to keep its day.
const DATE_ONLY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: DATE_ONLY_TIME_ZONE,
});

// The language colours from GitHub's open linguist data, which code hosts and
// the trending page itself use, so they read as data rather than decoration.
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  Python: "#3572a5",
  JavaScript: "#f1e05a",
  Go: "#00add8",
  Rust: "#dea584",
  Swift: "#f05138",
  Java: "#b07219",
};

function formatShortDate(isoOrDateKey: string): string {
  const isDateOnly = isoOrDateKey.length === 10;
  const value = isDateOnly ? `${isoOrDateKey}T00:00:00Z` : isoOrDateKey;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return isDateOnly ? DATE_ONLY_FORMATTER.format(date) : SHORT_DATE_FORMATTER.format(date);
}

function formatDelta(repo: GitHubTrendingClientRepository): string {
  if (repo.weeklyStarsStatus === "baseline") return "Baseline";
  const value = formatGitHubCompactNumber(repo.weeklyStars);
  return repo.weeklyStars > 0 ? `+${value}` : value;
}

function statusLabel(repo: GitHubTrendingClientRepository, windowDays: number): string {
  if (repo.weeklyStarsStatus === "measured") {
    return `${windowDays}d measured`;
  }
  if (repo.weeklyStarsStatus === "partial" && repo.weeklyStarsBaselineDate) {
    return `Since ${formatShortDate(repo.weeklyStarsBaselineDate)}`;
  }
  return "New baseline";
}

function toLogRepo(repo: GitHubTrendingClientRepository): StarLogRepo {
  return {
    id: repo.id,
    fullName: repo.fullName,
    weeklyStars: repo.weeklyStars,
    language: repo.primaryLanguage,
    weeklyStarsStatus: repo.weeklyStarsStatus,
  };
}

function getSegments(snapshot: GitHubTrendingClientSnapshot, kind: GitHubTrendingSegmentKind) {
  return kind === "language" ? snapshot.languages : snapshot.topics;
}

function buildSegmentLookup(snapshot: GitHubTrendingClientSnapshot) {
  return new Map(
    [...snapshot.languages, ...snapshot.topics].map((segment) => [segment.key, segment])
  );
}

function getReposForSegment(
  snapshot: GitHubTrendingClientSnapshot,
  kind: GitHubTrendingSegmentKind,
  segmentKey: string
): GitHubTrendingClientRepository[] {
  const segments = getSegments(snapshot, kind);
  if (segmentKey === "all") {
    const allowed = new Set(segments.flatMap((segment) => segment.repoIds));
    return snapshot.repositories.filter((repo) => allowed.has(repo.id));
  }

  const segment = segments.find((entry) => entry.key === segmentKey);
  if (!segment) return [];
  const allowed = new Set(segment.repoIds);
  return snapshot.repositories.filter((repo) => allowed.has(repo.id));
}

export function GitHubTrendingClient({ initialState, snapshot }: GitHubTrendingClientProps) {
  const searchParams = useSearchParams();
  const now = useClientNow();
  const hasManagedParams =
    searchParams.get("view") !== null ||
    searchParams.get("segment") !== null ||
    searchParams.get("sort") !== null ||
    searchParams.get("repo") !== null;
  const routeState = hasManagedParams
    ? normalizeGitHubTrendingState(searchParams)
    : initialState;
  const resolvedState = resolveGitHubTrendingState(routeState, snapshot);
  const desiredHref = buildGitHubTrendingHref(resolvedState, searchParams);

  const pushHref = useRouteSync("/github-trending-pulse", desiredHref);

  function navigate(nextState: GitHubTrendingRouteState) {
    const resolvedNext = resolveGitHubTrendingState(nextState, snapshot);
    const href = buildGitHubTrendingHref(resolvedNext, searchParams);
    pushHref(href);
  }

  const segments = getSegments(snapshot, resolvedState.kind);
  const segmentLookup = buildSegmentLookup(snapshot);
  const filteredRepos = sortGitHubTrendingRepositories(
    getReposForSegment(snapshot, resolvedState.kind, resolvedState.segment),
    resolvedState.sort
  );
  const selectedRepo = filteredRepos.find((repo) => repo.id === resolvedState.selectedRepoId);
  const measuredShare =
    snapshot.totals.repositories > 0
      ? Math.round((snapshot.totals.measuredWeeklyDeltaCount / snapshot.totals.repositories) * 100)
      : 0;

  function setKind(kind: GitHubTrendingSegmentKind) {
    navigate({ ...resolvedState, kind, segment: "all", selectedRepoId: null });
  }

  function setSegment(segment: string) {
    navigate({ ...resolvedState, segment, selectedRepoId: null });
  }

  function setSort(sort: GitHubTrendingSortKey) {
    navigate({ ...resolvedState, sort });
  }

  function toggleRepo(repoId: number) {
    navigate({
      ...resolvedState,
      selectedRepoId: resolvedState.selectedRepoId === repoId ? null : repoId,
    });
  }

  const updatedLabel =
    now === null ? formatDateTime(snapshot.generatedAt) : relativeAge(snapshot.generatedAt, now);

  return (
    <div className="gt-root">
      <div className="c97-shell c97-frame gt-page">
        <header className="gt-head">
          <h1 className="gt-title">GitHub Trending Pulse</h1>
          <p className="gt-lede">
            The most starred active public repositories in the languages and topics I track,
            ranked by the stars each one gained over the past week.
          </p>
          <p className="gt-status">
            {snapshot.sourceLabel} · updated {updatedLabel} · repositories pushed in the last{" "}
            {snapshot.activityWindowDays} days · {measuredShare}% of the weekly gains measured
          </p>
          {snapshot.sourceStatus?.status === "degraded" ? (
            <p className="gt-status gt-warn" role="status">
              {snapshot.sourceStatus.reusedSegments.length > 0
                ? `${snapshot.sourceStatus.reusedSegments.length} segments are using earlier data.`
                : `${snapshot.sourceStatus.failedSegments.length} segments are unavailable right now.`}
            </p>
          ) : null}
        </header>

        <div className="gt-board">
          <div className="gt-toolbar">
            <section aria-label="GitHub trending filters" className="gt-filters">
              <div role="group" aria-label="Trend segment type" className="gt-switch">
                {GITHUB_TRENDING_KIND_OPTIONS.map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    aria-pressed={resolvedState.kind === kind}
                    title={`Show ${GITHUB_TRENDING_KIND_LABELS[kind].toLowerCase()} segments`}
                    onClick={() => setKind(kind)}
                  >
                    {GITHUB_TRENDING_KIND_LABELS[kind]}
                  </button>
                ))}
              </div>

              <div role="group" aria-label="Filter by segment" className="gt-switch gt-switch--scroll">
                <button
                  type="button"
                  aria-pressed={resolvedState.segment === "all"}
                  onClick={() => setSegment("all")}
                >
                  All {GITHUB_TRENDING_KIND_LABELS[resolvedState.kind].toLowerCase()}s
                </button>
                {segments.map((segment) => (
                  <button
                    key={segment.key}
                    type="button"
                    aria-pressed={resolvedState.segment === segment.key}
                    onClick={() => setSegment(segment.key)}
                  >
                    {segment.label}
                  </button>
                ))}
              </div>
            </section>

            <div className="gt-sort">
              <span className="gt-label" aria-hidden="true">
                Sort
              </span>
              <div role="group" aria-label="Sort repositories" className="gt-switch">
                {GITHUB_TRENDING_SORT_OPTIONS.map((sort) => (
                  <button
                    key={sort}
                    type="button"
                    aria-pressed={resolvedState.sort === sort}
                    onClick={() => setSort(sort)}
                  >
                    {GITHUB_TRENDING_SORT_LABELS[sort]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <LanguageStrip repos={filteredRepos} windowDays={snapshot.windowDays} />

          {filteredRepos.length === 0 ? (
            <div className="gt-empty">
              <p className="gt-empty-title">No repositories match this filter</p>
              <p>Try switching segments or widening back to the full language or topic view.</p>
            </div>
          ) : (
            <RepositoryTable
              key={`${resolvedState.kind}:${resolvedState.segment}`}
              repositories={filteredRepos}
              selectedRepoId={selectedRepo?.id ?? null}
              segmentLookup={segmentLookup}
              windowDays={snapshot.windowDays}
              onToggleRepo={toggleRepo}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * How the filter's weekly stars split by primary language, as one strip in
 * the language colours, with the lead language named in words beside it.
 */
function LanguageStrip({
  repos,
  windowDays,
}: {
  repos: GitHubTrendingClientRepository[];
  windowDays: number;
}) {
  const languages = languageShares(repos.map(toLogRepo));
  const leader = languages[0];
  // The shares count only repositories that gained stars this week, so the caption names that base.
  const count = repos.filter((repo) => repo.weeklyStars > 0).length;
  const hasOther = languages.some((entry) => !(entry.language in LANGUAGE_COLORS));

  return (
    <div className="gt-strip-row">
      {languages.length > 0 ? (
        <div
          className="gt-strip"
          role="img"
          aria-label={`This week's stars by language. ${languages
            .map((entry) => `${entry.language} ${Math.round(entry.share * 100)}%`)
            .join(", ")}.`}
        >
          {languages.map((entry) => (
            <div
              key={entry.language}
              className="gt-strip-segment"
              style={{ width: `${entry.share * 100}%` }}
            >
              <span
                className="gt-strip-swatch"
                style={{ background: LANGUAGE_COLORS[entry.language] ?? "var(--gt-other)" }}
              />
              {entry.share >= 0.08 ? (
                <span className="gt-strip-label">{entry.language}</span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      <div className="gt-strip-notes">
        {leader ? (
          <p className="gt-caption">
            {leader.language} has {Math.round(leader.share * 100)}% of this week&apos;s star
            gain, counted across the {count} {count === 1 ? "repository" : "repositories"} in this
            view that gained stars.
          </p>
        ) : null}
        <p className="gt-legend">
          {hasOther ? (
            <span>
              <span className="gt-key gt-key--other" aria-hidden="true" />
              Other languages
            </span>
          ) : null}
          <span>
            <span className="gt-key" data-status="measured" aria-hidden="true" />
            {windowDays}d measured
          </span>
          <span>
            <span className="gt-key" data-status="partial" aria-hidden="true" />
            Partial window
          </span>
          <span>
            <span className="gt-key" data-status="baseline" aria-hidden="true" />
            New baseline
          </span>
        </p>
      </div>
    </div>
  );
}

interface RepositoryTableProps {
  repositories: GitHubTrendingClientRepository[];
  selectedRepoId: number | null;
  segmentLookup: Map<string, GitHubTrendingSegment>;
  windowDays: number;
  onToggleRepo: (repoId: number) => void;
}

// The full language or topic view holds every repository in every segment,
// which ran to 84 rows on a phone. The table opens on the first 25 and the
// rest sit behind one button; the parent keys this component on the filter,
// so a new filter starts folded again.
const TABLE_LIMIT = 25;

function RepositoryTable({
  repositories,
  selectedRepoId,
  segmentLookup,
  windowDays,
  onToggleRepo,
}: RepositoryTableProps) {
  const [showAll, setShowAll] = useState(false);
  // A deep link to a repository below the fold opens the whole table.
  const selectedIndex = repositories.findIndex((repo) => repo.id === selectedRepoId);
  const unfolded = showAll || repositories.length <= TABLE_LIMIT || selectedIndex >= TABLE_LIMIT;
  const visible = unfolded ? repositories : repositories.slice(0, TABLE_LIMIT);
  // Bars scale to the biggest gain in the whole filter, so unfolding never rescales them.
  const bars = new Map(starBars(repositories.map(toLogRepo)).map((bar) => [bar.id, bar.share]));

  return (
    <div className="gt-list">
      <div className="gt-scroll" role="region" aria-label="Repository table (scrolls sideways)" tabIndex={0}>
        <table className="gt-table">
          <caption className="sr-only">
            The most starred active repositories I track, with each one&apos;s star gain over
            the past week, total stars, primary language, and last pushed date.
          </caption>
          <thead>
            <tr>
              <th scope="col">Repository</th>
              <th scope="col" data-align="end">
                +{windowDays}d
              </th>
              <th scope="col" className="gt-col-bar">
                <span className="sr-only">Gain drawn to scale</span>
              </th>
              <th scope="col" data-align="end" className="gt-wide">
                Stars
              </th>
              <th scope="col" className="gt-wide">Language</th>
              <th scope="col" className="gt-wide">Pushed</th>
              <th scope="col" className="gt-wide">
                <span className="sr-only">Link</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((repo, index) => {
              const matchedSegments = repo.matchedSegments
                .map((key) => segmentLookup.get(key))
                .filter((segment): segment is GitHubTrendingSegment => Boolean(segment));
              return (
                <RepoRow
                  key={repo.id}
                  repo={repo}
                  rank={index + 1}
                  share={repo.weeklyStarsStatus === "baseline" ? 0.06 : bars.get(String(repo.id)) ?? 0}
                  isExpanded={repo.id === selectedRepoId}
                  matchedSegments={matchedSegments}
                  windowDays={windowDays}
                  onToggle={() => onToggleRepo(repo.id)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
      {unfolded ? null : (
        <button type="button" className="gt-more" onClick={() => setShowAll(true)}>
          Show all {repositories.length} repositories
        </button>
      )}
    </div>
  );
}

interface RepoRowProps {
  repo: GitHubTrendingClientRepository;
  rank: number;
  share: number;
  isExpanded: boolean;
  matchedSegments: GitHubTrendingSegment[];
  windowDays: number;
  onToggle: () => void;
}

/** The week's gain as a bar, solid when measured, hatched when partial, and outlined for a new baseline. */
function StarBar({ status, share, className }: { status: string; share: number; className: string }) {
  return (
    <span className={`gt-track ${className}`} aria-hidden="true">
      <span className="gt-bar" data-status={status} style={{ width: `${Math.max(share, 0) * 100}%` }} />
    </span>
  );
}

function RepoRow({ repo, rank, share, isExpanded, matchedSegments, windowDays, onToggle }: RepoRowProps) {
  const detailId = `github-trending-row-${repo.id}`;

  return (
    <>
      {/* The row stays clickable for pointer users, but the keyboard control
          is a real button on the name. role="button" on a <tr> broke table
          semantics and nested the Repo link inside an interactive element. */}
      <tr className="gt-row" data-open={isExpanded || undefined} onClick={onToggle}>
        <td>
          <div className="gt-repo">
          <span className="gt-rank">{rank}</span>
          <div className="gt-repo-text">
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-controls={isExpanded ? detailId : undefined}
              onClick={(event) => {
                event.stopPropagation();
                onToggle();
              }}
              className="gt-name"
            >
              {repo.fullName}
            </button>
            <p className="gt-desc">{repo.description ?? "No repository description provided."}</p>
            <StarBar status={repo.weeklyStarsStatus} share={share} className="gt-track--inline" />
          </div>
          </div>
        </td>
        <td data-align="end" className="gt-delta">
          <span className="gt-delta-value">{formatDelta(repo)}</span>
          <span className="gt-delta-status">{statusLabel(repo, windowDays)}</span>
        </td>
        <td className="gt-col-bar">
          <StarBar status={repo.weeklyStarsStatus} share={share} className="gt-track--column" />
        </td>
        <td data-align="end" className="gt-wide gt-num">
          {formatGitHubCompactNumber(repo.stars)}
        </td>
        <td className="gt-wide gt-muted">{repo.primaryLanguage ?? "Mixed"}</td>
        <td className="gt-wide gt-muted">{formatShortDate(repo.pushedAt)}</td>
        <td className="gt-wide" data-align="end">
          <a
            href={repo.url}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="gt-link"
          >
            Repo
            <ExternalLink aria-hidden="true" size={14} />
          </a>
        </td>
      </tr>
      {isExpanded ? (
        <tr id={detailId} className="gt-detail-row">
          <td colSpan={7}>
            <div className="gt-detail">
              <div className="gt-detail-tags">
                {matchedSegments.length > 0 ? (
                  <p className="gt-tags">
                    {matchedSegments.map((segment) => (
                      <span key={segment.key} className="gt-tag">
                        {segment.label}
                      </span>
                    ))}
                  </p>
                ) : null}
                {repo.topics.length > 0 ? (
                  <p className="gt-tags">
                    {repo.topics.slice(0, 10).map((topic) => (
                      <span key={topic} className="gt-tag gt-tag--topic">
                        {topic}
                      </span>
                    ))}
                  </p>
                ) : null}
              </div>
              <dl className="gt-facts">
                {/* Stars, language, pushed, and the link print here only under
                    1024px, where their table columns are hidden. */}
                <div className="gt-narrow">
                  <dt>Stars</dt>
                  <dd>{formatGitHubCompactNumber(repo.stars)}</dd>
                </div>
                <div className="gt-narrow">
                  <dt>Language</dt>
                  <dd>{repo.primaryLanguage ?? "Mixed"}</dd>
                </div>
                <div className="gt-narrow">
                  <dt>Pushed</dt>
                  <dd>{formatShortDate(repo.pushedAt)}</dd>
                </div>
                <div>
                  <dt>Forks</dt>
                  <dd>{formatGitHubCompactNumber(repo.forks)}</dd>
                </div>
                <div>
                  <dt>Issues</dt>
                  <dd>{formatGitHubCompactNumber(repo.openIssues)}</dd>
                </div>
                <div>
                  <dt>License</dt>
                  <dd>{repo.licenseSpdxId ?? "Unknown"}</dd>
                </div>
                <div>
                  <dt>Score</dt>
                  <dd>
                    {repo.trendScore.toLocaleString("en-US", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                  </dd>
                </div>
                <div className="gt-narrow">
                  <dt>Link</dt>
                  <dd>
                    <a href={repo.url} target="_blank" rel="noreferrer" className="gt-link">
                      Repo
                      <ExternalLink aria-hidden="true" size={14} />
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
