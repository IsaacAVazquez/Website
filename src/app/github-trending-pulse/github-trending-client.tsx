"use client";

import { startTransition, useEffect, type KeyboardEvent } from "react";
import {
  Activity,
  ArrowDownUp,
  Clock3,
  ExternalLink,
  GitFork,
  Languages,
  RefreshCw,
  Star,
  Tags,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { MetricCard } from "@/components/football/MetricCard";
import { EmptyPanel } from "@/components/football/EmptyPanel";
import { HomeStatsPanel } from "@/components/home/HomeStatsPanel";
import { ChartBar, Briefcase, FileText, BrandGithub } from "@/components/ui/ServerIcons";
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

interface GitHubTrendingClientProps {
  initialState: GitHubTrendingRouteState;
  snapshot: GitHubTrendingClientSnapshot;
}

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Waiting on refresh";
  return DATE_TIME_FORMATTER.format(date);
}

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
    [...snapshot.languages, ...snapshot.topics].map((segment) => [
      segment.key,
      segment,
    ])
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

function relativeAge(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function handleRowKeyDown(
  event: KeyboardEvent<HTMLTableRowElement>,
  onToggle: () => void
) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onToggle();
  }
}

export function GitHubTrendingClient({
  initialState,
  snapshot,
}: GitHubTrendingClientProps) {
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
  const selectedRepo = filteredRepos.find(
    (repo) => repo.id === resolvedState.selectedRepoId
  );
  const totalWeeklyStars = filteredRepos.reduce(
    (sum, repo) => sum + repo.weeklyStars,
    0
  );
  const measuredShare =
    snapshot.totals.repositories > 0
      ? Math.round(
          (snapshot.totals.measuredWeeklyDeltaCount /
            snapshot.totals.repositories) *
            100
        )
      : 0;

  function setKind(kind: GitHubTrendingSegmentKind) {
    navigate({
      ...resolvedState,
      kind,
      segment: "all",
      selectedRepoId: null,
    });
  }

  function setSegment(segment: string) {
    navigate({
      ...resolvedState,
      segment,
      selectedRepoId: null,
    });
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

  return (
    <div className="home-shell home-section space-y-8">
      <header className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <div className="space-y-4">
          <p className="home-kicker mb-0">Developer data</p>
          <h1 className="max-w-4xl text-3xl font-semibold tracking-[-0.04em] text-[var(--home-ink)] sm:text-5xl">
            GitHub Trending Pulse
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--home-ink-muted)]">
            Daily snapshot of active public repositories by language and topic,
            with star movement carried forward from the checked-in history.
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
            <span className="inline-flex min-h-[32px] items-center gap-2 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3">
              <RefreshCw aria-hidden="true" size={14} />
              Updated {relativeAge(snapshot.generatedAt)}
            </span>
            <span className="inline-flex min-h-[32px] items-center gap-2 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3">
              <Clock3 aria-hidden="true" size={14} />
              {snapshot.activityWindowDays}d active repo window
            </span>
          </div>
        </div>

        <section
          className="home-card p-5 sm:p-6"
          aria-labelledby="github-trending-freshness-heading"
        >
          <p className="home-kicker mb-3" id="github-trending-freshness-heading">
            Snapshot ledger
          </p>
          <dl className="space-y-4 text-sm">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--home-rule)] pb-3">
              <dt className="text-[var(--home-ink-muted)]">Generated</dt>
              <dd className="m-0 text-right font-semibold text-[var(--home-ink)]">
                {formatDateTime(snapshot.generatedAt)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-[var(--home-rule)] pb-3">
              <dt className="text-[var(--home-ink-muted)]">Source</dt>
              <dd className="m-0 text-right font-semibold text-[var(--home-ink)]">
                {snapshot.sourceLabel}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-[var(--home-ink-muted)]">Delta coverage</dt>
              <dd className="m-0 text-right font-semibold text-[var(--home-ink)]">
                {measuredShare}% measured
              </dd>
            </div>
          </dl>
        </section>
      </header>

      <HomeStatsPanel
        id="github-trending-stats"
        title="GitHub trending at a glance"
        meta={`Updated ${relativeAge(snapshot.generatedAt)}`}
        cells={[
          {
            label: "Repos tracked",
            value: <span className="tabular-nums">{snapshot.totals.repositories}</span>,
            sub: "Active public repositories",
          },
          {
            label: "7d star delta",
            value: <span className="tabular-nums">+{formatGitHubCompactNumber(snapshot.totals.weeklyStars)}</span>,
            sub: `${snapshot.windowDays}d snapshot delta`,
            tone: "good",
          },
          {
            label: "Languages tracked",
            value: <span className="tabular-nums">{snapshot.totals.languages}</span>,
            sub: "Segments by primary language",
          },
          {
            label: "Topics tracked",
            value: <span className="tabular-nums">{snapshot.totals.topics}</span>,
            sub: "Curated topic facets",
          },
          {
            label: "Visible repos",
            value: <span className="tabular-nums">{filteredRepos.length}</span>,
            sub: `${GITHUB_TRENDING_KIND_LABELS[resolvedState.kind]} filter`,
          },
          {
            label: "Visible 7d stars",
            value: <span className="tabular-nums">+{formatGitHubCompactNumber(totalWeeklyStars)}</span>,
            sub: "Star movement in current table",
          },
          {
            label: "Snapshot source",
            value: snapshot.sourceLabel,
            sub: `${measuredShare}% measured deltas`,
          },
          {
            label: "Updated",
            value: relativeAge(snapshot.generatedAt),
            sub: formatDateTime(snapshot.generatedAt),
          },
        ]}
        pills={[
          { label: "Languages", href: "/github-trending-pulse", icon: ChartBar },
          { label: "Topics", href: "/github-trending-pulse?view=topic", icon: FileText },
          { label: "Most starred", href: "/github-trending-pulse?sort=stars", icon: Briefcase },
          {
            label: "GitHub trending source",
            href: "https://github.com/trending",
            icon: BrandGithub,
            external: true,
          },
        ]}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Repos tracked"
          value={snapshot.totals.repositories.toString()}
          detail={`${snapshot.totals.languages} languages and ${snapshot.totals.topics} topics`}
        />
        <MetricCard
          label="Star movement"
          value={`+${formatGitHubCompactNumber(snapshot.totals.weeklyStars)}`}
          detail={`${snapshot.windowDays}d snapshot delta across tracked repos`}
        />
        <MetricCard
          label="Visible set"
          value={filteredRepos.length.toString()}
          detail={`${GITHUB_TRENDING_KIND_LABELS[resolvedState.kind]} filter, ${GITHUB_TRENDING_SORT_LABELS[resolvedState.sort].toLowerCase()} sort`}
        />
        <MetricCard
          label="Visible delta"
          value={`+${formatGitHubCompactNumber(totalWeeklyStars)}`}
          detail="Star movement inside the current table"
        />
      </section>

      <section className="home-card space-y-5 p-5 sm:p-6" aria-label="GitHub trending filters">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div
            role="tablist"
            aria-label="Trend segment type"
            className="inline-flex rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-1"
          >
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
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-sm font-semibold transition-[background-color,color,box-shadow] ${
                    isActive
                      ? "bg-[var(--home-paper)] text-[var(--home-ink)] shadow-sm"
                      : "text-[var(--home-ink-muted)] hover:text-[var(--home-ink)]"
                  }`}
                >
                  <Icon aria-hidden="true" size={16} />
                  {GITHUB_TRENDING_KIND_LABELS[kind]}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
              <ArrowDownUp aria-hidden="true" size={14} />
              Sort
            </span>
            {GITHUB_TRENDING_SORT_OPTIONS.map((sort) => {
              const isActive = resolvedState.sort === sort;
              return (
                <button
                  key={sort}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setSort(sort)}
                  className={`min-h-[44px] rounded-full border px-3 text-sm font-semibold transition-[background-color,border-color,color] ${
                    isActive
                      ? "border-[var(--home-ink)] bg-[var(--home-ink)] text-[var(--home-paper)]"
                      : "border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-[var(--home-ink-muted)] hover:text-[var(--home-ink)]"
                  }`}
                >
                  {GITHUB_TRENDING_SORT_LABELS[sort]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={resolvedState.segment === "all"}
            onClick={() => setSegment("all")}
            className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold transition-[background-color,border-color,color] ${
              resolvedState.segment === "all"
                ? "border-[var(--home-ink)] bg-[var(--home-ink)] text-[var(--home-paper)]"
                : "border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-[var(--home-ink-muted)] hover:text-[var(--home-ink)]"
            }`}
          >
            All {GITHUB_TRENDING_KIND_LABELS[resolvedState.kind].toLowerCase()}s
          </button>
          {segments.map((segment) => {
            const isActive = resolvedState.segment === segment.key;
            return (
              <button
                key={segment.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setSegment(segment.key)}
                className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold transition-[background-color,border-color,color] ${
                  isActive
                    ? "border-[var(--home-ink)] bg-[var(--home-ink)] text-[var(--home-paper)]"
                    : "border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-[var(--home-ink-muted)] hover:text-[var(--home-ink)]"
                }`}
              >
                {segment.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
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
      </section>
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

function RepositoryTable({
  repositories,
  selectedRepoId,
  segmentLookup,
  windowDays,
  onToggleRepo,
}: RepositoryTableProps) {
  return (
    <div className="home-card overflow-hidden p-0">
      <div className="scroll-shadow-x overflow-x-auto">
        <table className="min-w-[900px] border-collapse text-sm">
          <caption className="sr-only">
            GitHub trending repositories with weekly star movement, total stars,
            primary language, and last pushed date.
          </caption>
          <thead>
            <tr className="border-b border-[var(--home-rule)] bg-[var(--home-paper-alt)]">
              <th scope="col" className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                Repository
              </th>
              <th scope="col" className="px-4 py-3 text-right text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                +7d
              </th>
              <th scope="col" className="px-4 py-3 text-right text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                Stars
              </th>
              <th scope="col" className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                Language
              </th>
              <th scope="col" className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                Pushed
              </th>
              <th scope="col" className="px-4 py-3 text-right text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                Link
              </th>
            </tr>
          </thead>
          <tbody>
            {repositories.map((repo, index) => {
              const isExpanded = repo.id === selectedRepoId;
              const matchedSegments = repo.matchedSegments
                .map((key) => segmentLookup.get(key))
                .filter((segment): segment is GitHubTrendingSegment =>
                  Boolean(segment)
                );
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

function RepoRow({
  repo,
  rank,
  isExpanded,
  matchedSegments,
  windowDays,
  onToggle,
}: RepoRowProps) {
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
        className="cursor-pointer border-b border-[var(--home-rule)] transition-[background-color] hover:bg-[var(--home-paper-alt)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2"
      >
        <td className="px-4 py-4 align-top">
          <div className="flex gap-3">
            <span className="mt-1 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-xs font-semibold text-[var(--home-ink-muted)]">
              {rank}
            </span>
            <div className="min-w-0">
              <p className="mb-1 max-w-none font-semibold leading-5 text-[var(--home-ink)]">
                {repo.fullName}
              </p>
              <p className="mb-0 line-clamp-2 max-w-[44rem] text-sm leading-6 text-[var(--home-ink-muted)]">
                {repo.description ?? "No repository description provided."}
              </p>
            </div>
          </div>
        </td>
        <td className="px-4 py-4 text-right align-top">
          <span className="font-mono text-base font-semibold text-[var(--home-ink)]">
            {formatDelta(repo)}
          </span>
          <span className="mt-1 block text-xs text-[var(--home-ink-muted)]">
            {statusLabel(repo, windowDays)}
          </span>
        </td>
        <td className="px-4 py-4 text-right align-top">
          <span className="inline-flex items-center justify-end gap-1 font-mono font-semibold text-[var(--home-ink)]">
            <Star aria-hidden="true" size={14} />
            {formatGitHubCompactNumber(repo.stars)}
          </span>
        </td>
        <td className="px-4 py-4 align-top text-[var(--home-ink-muted)]">
          {repo.primaryLanguage ?? "Mixed"}
        </td>
        <td className="px-4 py-4 align-top text-[var(--home-ink-muted)]">
          {formatShortDate(repo.pushedAt)}
        </td>
        <td className="px-4 py-4 text-right align-top">
          <a
            href={repo.url}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--home-rule)] px-3 text-sm font-semibold text-[var(--home-ink)] transition-[background-color,border-color,color] hover:border-[var(--home-ink)] hover:bg-[var(--home-paper-alt)]"
          >
            Repo
            <ExternalLink aria-hidden="true" size={14} />
          </a>
        </td>
      </tr>
      {isExpanded ? (
        <tr id={detailId} className="border-b border-[var(--home-rule)] bg-[var(--home-paper-alt)]">
          <td colSpan={6} className="px-4 py-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {matchedSegments.map((segment) => (
                    <span
                      key={segment.key}
                      className="inline-flex items-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-1 text-xs font-semibold text-[var(--home-ink-muted)]"
                    >
                      {segment.label}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {repo.topics.slice(0, 10).map((topic) => (
                    <span
                      key={topic}
                      className="inline-flex items-center rounded-full border border-[var(--home-rule)] px-2.5 py-1 text-xs text-[var(--home-ink-muted)]"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
                <div>
                  <dt className="text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                    Forks
                  </dt>
                  <dd className="m-0 mt-1 inline-flex items-center gap-1 font-mono text-[var(--home-ink)]">
                    <GitFork aria-hidden="true" size={14} />
                    {formatGitHubCompactNumber(repo.forks)}
                  </dd>
                </div>
                <div>
                  <dt className="text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                    Issues
                  </dt>
                  <dd className="m-0 mt-1 font-mono text-[var(--home-ink)]">
                    {formatGitHubCompactNumber(repo.openIssues)}
                  </dd>
                </div>
                <div>
                  <dt className="text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                    License
                  </dt>
                  <dd className="m-0 mt-1 font-mono text-[var(--home-ink)]">
                    {repo.licenseSpdxId ?? "Unknown"}
                  </dd>
                </div>
                <div>
                  <dt className="text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                    Score
                  </dt>
                  <dd className="m-0 mt-1 font-mono text-[var(--home-ink)]">
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

function SegmentSummary({
  segments,
  repositories,
  selectedSegment,
  onSelectSegment,
}: SegmentSummaryProps) {
  const repoById = new Map(repositories.map((repo) => [repo.id, repo]));

  return (
    <aside className="home-card p-5 sm:p-6" aria-labelledby="github-segment-summary-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="home-kicker mb-1">Segments</p>
          <h2 id="github-segment-summary-heading" className="text-lg font-semibold text-[var(--home-ink)]">
            Snapshot leaders
          </h2>
        </div>
        <Activity aria-hidden="true" className="text-[var(--home-ink-muted)]" size={20} />
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
              className={`block min-h-[64px] w-full rounded-[var(--radius-xl)] border px-3 py-3 text-left transition-[background-color,border-color,color] ${
                isActive
                  ? "border-[var(--home-ink)] bg-[var(--home-paper-alt)]"
                  : "border-[var(--home-rule)] hover:border-[var(--home-ink)] hover:bg-[var(--home-paper-alt)]"
              }`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-semibold text-[var(--home-ink)]">
                  {segment.label}
                </span>
                <span className="font-mono text-sm text-[var(--home-ink)]">
                  +{formatGitHubCompactNumber(segment.weeklyStars)}
                </span>
              </span>
              <span className="mt-1 block text-xs text-[var(--home-ink-muted)]">
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
