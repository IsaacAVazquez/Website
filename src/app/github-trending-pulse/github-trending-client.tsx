"use client";

import {
  Activity,
  ArrowDownUp,
  ExternalLink,
  GitFork,
  Languages,
  Star,
  Tags,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { EmptyPanel } from "@/components/football/EmptyPanel";
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
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
  GITHUB_TRENDING_ROUTE,
  GITHUB_TRENDING_SORT_LABELS,
  GITHUB_TRENDING_SORT_OPTIONS,
  normalizeGitHubTrendingState,
  resolveGitHubTrendingState,
} from "./github-trending-state";
import { StarLogBoard } from "./StarLogBoard";
import { languageShares } from "./star-log";
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

  const lead = PROJECT_PRESS[GITHUB_TRENDING_ROUTE].lead;
  const leadingLanguage = languageShares(
    snapshot.repositories.map((repo) => ({
      id: repo.id,
      fullName: repo.fullName,
      weeklyStars: repo.weeklyStars,
      language: repo.primaryLanguage,
      weeklyStarsStatus: repo.weeklyStarsStatus,
    }))
  )[0];
  const standfirst =
    "I keep a daily snapshot of the most starred active public repositories in each language and topic I track, and I wanted the board to read the way a git log does, so each repository's star gain over the past week reads as a bar you can compare at a glance. The strip across the top shows how that star gain splits across languages for the repositories in the current filter.";
  const updatedLabel =
    now === null ? formatDateTime(snapshot.generatedAt) : relativeAge(snapshot.generatedAt, now);
  const meta = `${snapshot.sourceLabel} · updated ${updatedLabel} · ${snapshot.activityWindowDays}d active repo window · ${measuredShare}% of deltas measured`;

  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="GitHub Trending Pulse"
        standfirst={standfirst}
        meta={meta}
        readouts={[
          {
            label: "Repos tracked",
            value: `${snapshot.totals.repositories}`,
            detail: `${snapshot.totals.languages} languages, ${snapshot.totals.topics} topics`,
          },
          {
            label: "7d star delta",
            value: `+${formatGitHubCompactNumber(snapshot.totals.weeklyStars)}`,
            detail: `${snapshot.windowDays}d snapshot delta`,
          },
          {
            label: "Leading language",
            value: leadingLanguage?.language ?? "None yet",
            detail: leadingLanguage
              ? `${Math.round(leadingLanguage.share * 100)}% of the stars the ${snapshot.totals.repositories} tracked repos gained over the past week`
              : undefined,
          },
        ]}
      >
        <StarLogBoard repos={filteredRepos} windowDays={snapshot.windowDays} />
      </Catalog97ProjectHero>

      <section
        className="c97-band c97-sheet"
        data-c97-surface="paper"
        data-seam="torn"
        aria-label="GitHub trending filters"
      >
        <div className="c97-shell" style={{ display: "grid", gap: "var(--c97-sp-5)" }}>
          {/* The degraded note sits inside this band rather than on a paper
              band of its own, which tore a sheet over the same surface. */}
          {snapshot.sourceStatus?.status === "degraded" ? (
            <p className="c97-meta" style={{ color: "var(--c97-warning)" }} role="status">
              {snapshot.sourceStatus.reusedSegments.length > 0
                ? `${snapshot.sourceStatus.reusedSegments.length} segments are using earlier data.`
                : `${snapshot.sourceStatus.failedSegments.length} segments are unavailable right now.`}
            </p>
          ) : null}
          <h2 className="c97-poster-sm">The board</h2>
          <div className="flex flex-wrap items-center justify-between" style={{ gap: "var(--c97-sp-2)" }}>
            <div role="group" aria-label="Trend segment type" className="c97-segmented">
              {GITHUB_TRENDING_KIND_OPTIONS.map((kind) => {
                const isActive = resolvedState.kind === kind;
                const Icon = kind === "language" ? Languages : Tags;
                return (
                  <button
                    key={kind}
                    type="button"
                    aria-pressed={isActive}
                    title={`Show ${GITHUB_TRENDING_KIND_LABELS[kind].toLowerCase()} segments`}
                    onClick={() => setKind(kind)}
                    className="min-h-[44px]"
                  >
                    <Icon aria-hidden="true" size={16} />
                    {GITHUB_TRENDING_KIND_LABELS[kind]}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center" style={{ gap: "var(--c97-sp-1)" }}>
              <span className="c97-kicker" style={{ marginBottom: 0 }}>
                <ArrowDownUp aria-hidden="true" size={14} style={{ display: "inline", marginRight: "4px" }} />
                Sort
              </span>
              <div role="group" aria-label="Sort repositories" className="c97-segmented">
                {GITHUB_TRENDING_SORT_OPTIONS.map((sort) => (
                  <button
                    key={sort}
                    type="button"
                    aria-pressed={resolvedState.sort === sort}
                    onClick={() => setSort(sort)}
                    className="min-h-[44px]"
                  >
                    {GITHUB_TRENDING_SORT_LABELS[sort]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div role="group" aria-label="Filter by segment" className="c97-segmented">
            <button
              type="button"
              aria-pressed={resolvedState.segment === "all"}
              onClick={() => setSegment("all")}
              className="min-h-[44px]"
            >
              All {GITHUB_TRENDING_KIND_LABELS[resolvedState.kind].toLowerCase()}s
            </button>
            {segments.map((segment) => (
              <button
                key={segment.key}
                type="button"
                aria-pressed={resolvedState.segment === segment.key}
                onClick={() => setSegment(segment.key)}
                className="min-h-[44px]"
              >
                {segment.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
        <div className="c97-shell">
          <div className="grid xl:grid-cols-[minmax(0,1fr)_340px]" style={{ gap: "var(--c97-sp-3)" }}>
            {filteredRepos.length === 0 ? (
              <EmptyPanel
                title="No repositories match this filter"
                description="Try switching segments or widening back to the full language or topic view."
              />
            ) : (
              <RepositoryTable
                repositories={filteredRepos}
                selectedRepoId={selectedRepo?.id ?? null}
                segmentLookup={segmentLookup}
                windowDays={snapshot.windowDays}
                onToggleRepo={toggleRepo}
              />
            )}
            <SegmentSummary
              segments={segments}
              repositories={snapshot.repositories}
              selectedSegment={resolvedState.segment}
              onSelectSegment={setSegment}
            />
          </div>
        </div>
      </section>
    </>
  );
}

interface RepositoryTableProps {
  repositories: GitHubTrendingClientRepository[];
  selectedRepoId: number | null;
  segmentLookup: Map<string, GitHubTrendingSegment>;
  windowDays: number;
  onToggleRepo: (repoId: number) => void;
}

function RepositoryTable({
  repositories,
  selectedRepoId,
  segmentLookup,
  windowDays,
  onToggleRepo,
}: RepositoryTableProps) {
  return (
    <div className="overflow-x-auto" role="region" aria-label="Repository table (scrolls sideways)" tabIndex={0}>
      <table className="c97-table" style={{ minWidth: "820px" }}>
        <caption className="sr-only">
          The most starred active repositories I track, with each one&apos;s star gain over
          the past week, total stars, primary language, and last pushed date.
        </caption>
        <thead>
          <tr>
            <th scope="col">Repository</th>
            <th scope="col" data-align="end">
              +7d
            </th>
            <th scope="col" data-align="end">
              Stars
            </th>
            <th scope="col">Language</th>
            <th scope="col">Pushed</th>
            <th scope="col" data-align="end">
              Link
            </th>
          </tr>
        </thead>
        <tbody>
          {repositories.map((repo, index) => {
            const isExpanded = repo.id === selectedRepoId;
            const matchedSegments = repo.matchedSegments
              .map((key) => segmentLookup.get(key))
              .filter((segment): segment is GitHubTrendingSegment => Boolean(segment));
            return (
              <RepoRow
                key={repo.id}
                repo={repo}
                rank={index + 1}
                isExpanded={isExpanded}
                matchedSegments={matchedSegments}
                windowDays={windowDays}
                onToggle={() => onToggleRepo(repo.id)}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface RepoRowProps {
  repo: GitHubTrendingClientRepository;
  rank: number;
  isExpanded: boolean;
  matchedSegments: GitHubTrendingSegment[];
  windowDays: number;
  onToggle: () => void;
}

function RepoRow({ repo, rank, isExpanded, matchedSegments, windowDays, onToggle }: RepoRowProps) {
  const detailId = `github-trending-row-${repo.id}`;

  return (
    <>
      {/* The row stays clickable for pointer users, but the keyboard control
          is a real button on the name. role="button" on a <tr> broke table
          semantics and nested the Repo link inside an interactive element. */}
      <tr onClick={onToggle} style={{ cursor: "pointer" }}>
        <td>
          <div className="flex" style={{ gap: "var(--c97-sp-1)" }}>
            <span
              className="c97-mono"
              style={{ color: "var(--c97-ink-2)", fontSize: "var(--c97-fs-small)" }}
            >
              {rank}
            </span>
            <div className="min-w-0">
              <p style={{ marginBottom: "var(--c97-sp-1)" }}>
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={isExpanded ? detailId : undefined}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggle();
                  }}
                  className="c97-serif inline-flex min-h-[44px] items-center text-left"
                  style={{ fontWeight: 600, color: "var(--c97-ink)" }}
                >
                  {repo.fullName}
                </button>
              </p>
              <p
                className="line-clamp-2"
                style={{ color: "var(--c97-ink-2)", maxWidth: "44rem", marginBottom: "0" }}
              >
                {repo.description ?? "No repository description provided."}
              </p>
            </div>
          </div>
        </td>
        <td data-align="end">
          <span className="c97-mono" style={{ fontWeight: 600 }}>{formatDelta(repo)}</span>
          <span className="block" style={{ color: "var(--c97-ink-2)", fontSize: "var(--c97-fs-small)" }}>
            {statusLabel(repo, windowDays)}
          </span>
        </td>
        <td data-align="end">
          <span className="c97-mono inline-flex items-center justify-end" style={{ fontWeight: 600, gap: "var(--c97-sp-0)" }}>
            <Star aria-hidden="true" size={14} />
            {formatGitHubCompactNumber(repo.stars)}
          </span>
        </td>
        <td style={{ color: "var(--c97-ink-2)" }}>{repo.primaryLanguage ?? "Mixed"}</td>
        <td style={{ color: "var(--c97-ink-2)" }}>{formatShortDate(repo.pushedAt)}</td>
        <td data-align="end">
          <a
            href={repo.url}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex min-h-[44px] items-center"
            style={{ gap: "var(--c97-sp-1)", color: "var(--c97-ink)" }}
          >
            Repo
            <ExternalLink aria-hidden="true" size={14} />
          </a>
        </td>
      </tr>
      {isExpanded ? (
        <tr id={detailId}>
          <td colSpan={6}>
            <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]" style={{ gap: "var(--c97-sp-2)", padding: "var(--c97-sp-3) 0" }}>
              <div className="flex flex-col" style={{ gap: "var(--c97-sp-1)" }}>
                <div className="flex flex-wrap" style={{ gap: "var(--c97-sp-1)" }}>
                  {matchedSegments.map((segment) => (
                    <span key={segment.key} className="c97-chip">
                      {segment.label}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap" style={{ gap: "var(--c97-sp-1)" }}>
                  {repo.topics.slice(0, 10).map((topic) => (
                    <span key={topic} className="c97-chip">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              <dl className="grid grid-cols-2" style={{ rowGap: "var(--c97-sp-1)", columnGap: "var(--c97-sp-2)" }}>
                <div>
                  <dt className="c97-stat-label">Forks</dt>
                  <dd className="c97-mono inline-flex items-center" style={{ color: "var(--c97-ink)", gap: "var(--c97-sp-0)" }}>
                    <GitFork aria-hidden="true" size={14} />
                    {formatGitHubCompactNumber(repo.forks)}
                  </dd>
                </div>
                <div>
                  <dt className="c97-stat-label">Issues</dt>
                  <dd className="c97-mono" style={{ color: "var(--c97-ink)" }}>
                    {formatGitHubCompactNumber(repo.openIssues)}
                  </dd>
                </div>
                <div>
                  <dt className="c97-stat-label">License</dt>
                  <dd className="c97-mono" style={{ color: "var(--c97-ink)" }}>
                    {repo.licenseSpdxId ?? "Unknown"}
                  </dd>
                </div>
                <div>
                  <dt className="c97-stat-label">Score</dt>
                  <dd className="c97-mono" style={{ color: "var(--c97-ink)" }}>
                    {repo.trendScore.toFixed(1)}
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

interface SegmentSummaryProps {
  segments: GitHubTrendingSegment[];
  repositories: GitHubTrendingClientRepository[];
  selectedSegment: string;
  onSelectSegment: (segment: string) => void;
}

function SegmentSummary({ segments, repositories, selectedSegment, onSelectSegment }: SegmentSummaryProps) {
  const repoById = new Map(repositories.map((repo) => [repo.id, repo]));

  return (
    <aside className="c97-panel" aria-labelledby="github-segment-summary-heading">
      <div className="flex items-center justify-between" style={{ marginBottom: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
        <div>
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Segments</p>
          <h2 id="github-segment-summary-heading" className="c97-serif" style={{ fontSize: "var(--c97-fs-h3)" }}>
            Snapshot leaders
          </h2>
        </div>
        <Activity aria-hidden="true" style={{ color: "var(--c97-ink-2)" }} size={20} />
      </div>
      <div className="flex flex-col" style={{ gap: "var(--c97-sp-1)" }}>
        {segments.map((segment) => {
          const topRepo = segment.topRepoId ? repoById.get(segment.topRepoId) : null;
          const isActive = selectedSegment === segment.key;
          return (
            <button
              key={segment.key}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelectSegment(segment.key)}
              className={`c97-segment-leader block min-h-[64px] w-full text-left ${isActive ? "c97-offset" : ""}`}
              style={{
                background: "var(--c97-surface)",
                padding: "var(--c97-sp-2) var(--c97-sp-3)",
                border: `1px solid ${isActive ? "var(--c97-ink)" : "var(--c97-rule)"}`,
              }}
            >
              <span className="flex items-center justify-between" style={{ gap: "var(--c97-sp-1)" }}>
                <span className="c97-segment-leader-name" style={{ fontWeight: 600 }}>{segment.label}</span>
                <span className="c97-mono" style={{ color: "var(--c97-ink)" }}>
                  +{formatGitHubCompactNumber(segment.weeklyStars)}
                </span>
              </span>
              <span className="block" style={{ color: "var(--c97-ink-2)", fontSize: "var(--c97-fs-small)", marginTop: "var(--c97-sp-0)" }}>
                {segment.repoCount} repos
                {topRepo ? ` · ${topRepo.fullName}` : ""}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
