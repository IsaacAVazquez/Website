"use client";

import { startTransition, useEffect, type KeyboardEvent } from "react";
import {
  Activity,
  ArrowDownUp,
  ExternalLink,
  GitFork,
  Languages,
  Star,
  Tags,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyPanel } from "@/components/football/EmptyPanel";
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import { relativeAge } from "@/lib/utils";
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
import "./github-trending-pulse.css";

interface GitHubTrendingClientProps {
  initialState: GitHubTrendingRouteState;
  snapshot: GitHubTrendingClientSnapshot;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function formatShortDate(isoOrDateKey: string): string {
  const value = isoOrDateKey.length === 10 ? `${isoOrDateKey}T00:00:00Z` : isoOrDateKey;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return DATE_FORMATTER.format(date);
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

function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, onToggle: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onToggle();
  }
}

export function GitHubTrendingClient({ initialState, snapshot }: GitHubTrendingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasManagedParams =
    searchParams.get("view") !== null ||
    searchParams.get("segment") !== null ||
    searchParams.get("sort") !== null ||
    searchParams.get("repo") !== null;
  const routeState = hasManagedParams
    ? normalizeGitHubTrendingState(searchParams)
    : initialState;
  const resolvedState = resolveGitHubTrendingState(routeState, snapshot);
  const currentQuery = searchParams.toString();
  const currentHref = `/github-trending-pulse${currentQuery ? `?${currentQuery}` : ""}`;
  const desiredHref = buildGitHubTrendingHref(resolvedState, searchParams);

  useEffect(() => {
    if (currentHref === desiredHref) return;
    startTransition(() => {
      router.replace(desiredHref, { scroll: false });
    });
  }, [currentHref, desiredHref, router]);

  function navigate(nextState: GitHubTrendingRouteState) {
    const resolvedNext = resolveGitHubTrendingState(nextState, snapshot);
    const href = buildGitHubTrendingHref(resolvedNext, searchParams);
    if (href === currentHref) return;
    startTransition(() => {
      router.push(href, { scroll: false });
    });
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
    "I keep a daily snapshot of active public repositories by language and topic, and I wanted the board to read the way a git log does, so each repository's weekly star movement reads as a bar you can compare at a glance. The strip across the top shows which languages picked up the week's stars.";
  const meta = `${snapshot.sourceLabel} · updated ${relativeAge(snapshot.generatedAt)} · ${snapshot.activityWindowDays}d active repo window · ${measuredShare}% of deltas measured`;

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
              ? `${Math.round(leadingLanguage.share * 100)}% of the week's stars`
              : undefined,
          },
        ]}
      >
        <StarLogBoard repos={filteredRepos} windowDays={snapshot.windowDays} />
      </Catalog97ProjectHero>

      {snapshot.sourceStatus?.status === "degraded" ? (
        <div className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
          <div className="c97-shell">
            <p className="c97-meta" style={{ color: "var(--c97-warning)" }} role="status">
              {snapshot.sourceStatus.reusedSegments.length > 0
                ? `${snapshot.sourceStatus.reusedSegments.length} segments are using earlier data.`
                : `${snapshot.sourceStatus.failedSegments.length} segments are unavailable right now.`}
            </p>
          </div>
        </div>
      ) : null}

      <section
        className="c97-band c97-sheet"
        data-c97-surface="paper"
        data-seam="torn"
        aria-label="GitHub trending filters"
      >
        <div className="c97-shell" style={{ display: "grid", gap: "var(--c97-sp-5)" }}>
          <h2 className="c97-poster-sm">The board</h2>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div role="tablist" aria-label="Trend segment type" className="c97-segmented">
              {GITHUB_TRENDING_KIND_OPTIONS.map((kind) => {
                const isActive = resolvedState.kind === kind;
                const Icon = kind === "language" ? Languages : Tags;
                return (
                  <button
                    key={kind}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
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

            <div className="flex flex-wrap items-center gap-3">
              <span className="c97-kicker" style={{ marginBottom: 0 }}>
                <ArrowDownUp aria-hidden="true" size={14} style={{ display: "inline", marginRight: "4px" }} />
                Sort
              </span>
              <div className="c97-segmented">
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

          <div className="c97-segmented">
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
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
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
    <div className="overflow-x-auto">
      <table className="c97-table" style={{ minWidth: "820px" }}>
        <caption className="sr-only">
          GitHub trending repositories with weekly star movement, total stars, primary
          language, and last pushed date.
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
      <tr
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
        aria-controls={detailId}
        onClick={onToggle}
        onKeyDown={(event) => handleRowKeyDown(event, onToggle)}
        style={{ cursor: "pointer" }}
      >
        <td>
          <div className="flex gap-3">
            <span
              className="c97-mono"
              style={{ color: "var(--c97-ink-2)", fontSize: "var(--c97-fs-small)" }}
            >
              {rank}
            </span>
            <div className="min-w-0">
              <p className="c97-serif mb-1" style={{ fontWeight: 600, color: "var(--c97-ink)" }}>
                {repo.fullName}
              </p>
              <p
                className="mb-0 line-clamp-2"
                style={{ color: "var(--c97-ink-2)", maxWidth: "44rem" }}
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
          <span className="c97-mono inline-flex items-center justify-end gap-1" style={{ fontWeight: 600 }}>
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
            className="inline-flex min-h-[44px] items-center gap-2"
            style={{ color: "var(--c97-ink)" }}
          >
            Repo
            <ExternalLink aria-hidden="true" size={14} />
          </a>
        </td>
      </tr>
      {isExpanded ? (
        <tr id={detailId}>
          <td colSpan={6}>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]" style={{ padding: "var(--c97-sp-3) 0" }}>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {matchedSegments.map((segment) => (
                    <span key={segment.key} className="c97-chip">
                      {segment.label}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {repo.topics.slice(0, 10).map((topic) => (
                    <span key={topic} className="c97-chip">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-5 gap-y-3">
                <div>
                  <dt className="c97-stat-label">Forks</dt>
                  <dd className="c97-mono inline-flex items-center gap-1" style={{ color: "var(--c97-ink)" }}>
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
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="c97-kicker mb-1">Segments</p>
          <h2 id="github-segment-summary-heading" className="c97-serif" style={{ fontSize: "var(--c97-fs-h3)" }}>
            Snapshot leaders
          </h2>
        </div>
        <Activity aria-hidden="true" style={{ color: "var(--c97-ink-2)" }} size={20} />
      </div>
      <div className="space-y-2">
        {segments.map((segment) => {
          const topRepo = segment.topRepoId ? repoById.get(segment.topRepoId) : null;
          const isActive = selectedSegment === segment.key;
          return (
            <button
              key={segment.key}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelectSegment(segment.key)}
              className={`block min-h-[64px] w-full text-left ${isActive ? "c97-offset" : ""}`}
              style={{
                background: "var(--c97-surface)",
                padding: "var(--c97-sp-2) var(--c97-sp-3)",
                border: `1px solid ${isActive ? "var(--c97-ink)" : "var(--c97-rule)"}`,
              }}
            >
              <span className="flex items-center justify-between gap-3">
                <span style={{ fontWeight: 600, color: "var(--c97-ink)" }}>{segment.label}</span>
                <span className="c97-mono" style={{ color: "var(--c97-ink)" }}>
                  +{formatGitHubCompactNumber(segment.weeklyStars)}
                </span>
              </span>
              <span className="mt-1 block" style={{ color: "var(--c97-ink-2)", fontSize: "var(--c97-fs-small)" }}>
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
