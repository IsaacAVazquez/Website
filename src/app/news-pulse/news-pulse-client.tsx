"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { ChevronDown, CircleAlert, ExternalLink } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import {
  NEWS_SOURCE_IDS,
  SOURCE_META,
  type NewsFeedId,
} from "@/lib/news-pulse-sources";
import type { NewsPulseFeedResponse } from "@/lib/newsPulseServer";
import type { NewsArticle, TopicCluster } from "@/lib/news-pulse-utils";
import {
  analyzeSentiment,
  calculateReadingLevel,
  clusterArticlesByStory,
  extractTopics,
  getOrderedSourcesForArticles,
} from "@/lib/news-pulse-utils";
import { NewsFrontPage } from "./NewsFrontPage";
import {
  buildNewsPulseHref,
  NEWS_PULSE_ROUTE,
  normalizeNewsPulseState,
  SOURCE_LABELS,
  SOURCE_OPTIONS,
  VIEW_LABELS,
  VIEW_OPTIONS,
  type NewsPulseSearchState,
  type NewsSource,
} from "./news-pulse-state";
import "./news-pulse.css";

interface NewsPulseClientProps {
  initialFeed?: NewsPulseFeedResponse;
  initialState: NewsPulseSearchState;
}

type FeedResponse = NewsPulseFeedResponse;

const LAST_FETCHED_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatFetchedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Waiting on a refresh"
    : LAST_FETCHED_FORMATTER.format(date);
}

function getSourceBadgeStyle(sourceColor: string): CSSProperties {
  return {
    color: "var(--c97-ink)",
    borderColor: `color-mix(in srgb, ${sourceColor} 58%, var(--c97-rule))`,
    background: `color-mix(in srgb, ${sourceColor} 12%, var(--c97-surface))`,
  };
}

function getReadabilityTone(score: number): CSSProperties {
  if (score >= 70) return { color: "var(--c97-positive)" };
  if (score >= 50) return { color: "var(--c97-accent)" };
  return { color: "var(--c97-ink-2)" };
}

function buildFeedErrorMessage(status: number, payload: FeedResponse | null): string {
  const parts = [
    payload?.message,
    Array.isArray(payload?.errors) && payload.errors.length > 0
      ? payload.errors.join("; ")
      : null,
  ].filter((part): part is string => Boolean(part));

  if (parts.length > 0) return parts.join(" ");
  return `Request failed with status ${status}.`;
}

/**
 * Native <select>: a single-choice source picker, so the platform control
 * supplies Esc-to-close, click-outside dismiss, focus return, keyboard
 * type-ahead, and the OS picker on mobile. The wrapping <label> gives it the
 * accessible name ("Source").
 */
function SourceDropdown({
  value,
  onValueChange,
}: {
  value: NewsSource;
  onValueChange: (value: NewsSource) => void;
}) {
  return (
    <label
      className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 border px-4 py-2 text-sm font-semibold focus-within:outline focus-within:outline-2 focus-within:outline-offset-2"
      style={{ borderColor: "var(--c97-rule)", background: "var(--c97-field)", color: "var(--c97-ink)" }}
    >
      <span className="c97-kicker" style={{ marginBottom: 0 }}>
        Source
      </span>
      <select
        value={value}
        onChange={(event) => onValueChange(event.target.value as NewsSource)}
        className="cursor-pointer appearance-none border-none bg-transparent text-sm font-semibold text-inherit outline-none"
        style={{ fontFamily: "var(--c97-font-body)" }}
      >
        {SOURCE_OPTIONS.map((source) => (
          <option key={source} value={source}>
            {SOURCE_LABELS[source]}
          </option>
        ))}
      </select>
      <ChevronDown className="h-4 w-4" aria-hidden="true" />
    </label>
  );
}

export function NewsPulseClient({
  initialFeed,
  initialState,
}: NewsPulseClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasManagedParams =
    searchParams.get("view") !== null || searchParams.get("source") !== null;
  const routeState = useMemo(
    () => (hasManagedParams ? normalizeNewsPulseState(searchParams) : initialState),
    [hasManagedParams, initialState, searchParams],
  );

  function updateRouteState(next: Partial<NewsPulseSearchState>) {
    const href = buildNewsPulseHref({ ...routeState, ...next });
    startTransition(() => router.push(href, { scroll: false }));
  }

  const hasUsableInitialFeed = (initialFeed?.articles.length ?? 0) > 0;
  const [articles, setArticles] = useState<NewsArticle[]>(
    initialFeed?.articles ?? []
  );
  const [loading, setLoading] = useState(!initialFeed);
  const [error, setError] = useState<string | null>(
    initialFeed?.dataStatus === "unavailable"
      ? initialFeed.message ?? "I could not load the feeds."
      : null
  );
  const [feedErrors, setFeedErrors] = useState<string[]>(
    initialFeed?.errors ?? []
  );
  const [fetchedAt, setFetchedAt] = useState(initialFeed?.fetchedAt ?? "");
  const [reloadKey, setReloadKey] = useState(0);
  const hasCompletedInitialRefresh = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let timedOut = false;
    let unmounted = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);

    async function loadFeeds() {
      const showLoading =
        hasCompletedInitialRefresh.current || !hasUsableInitialFeed;
      hasCompletedInitialRefresh.current = true;
      if (showLoading) setLoading(true);
      setError(null);
      setFeedErrors([]);

      try {
        const response = await fetch("/api/news-pulse", { signal: controller.signal });
        const payload = (await response.json().catch(() => null)) as FeedResponse | null;

        if (unmounted) return;

        if (!response.ok) {
          setArticles([]);
          setFetchedAt(payload?.fetchedAt ?? "");
          setFeedErrors(Array.isArray(payload?.errors) ? payload.errors : []);
          setError(buildFeedErrorMessage(response.status, payload));
          return;
        }

        setArticles(Array.isArray(payload?.articles) ? payload.articles : []);
        setFetchedAt(payload?.fetchedAt ?? "");
        setFeedErrors(Array.isArray(payload?.errors) ? payload.errors : []);
      } catch (fetchError) {
        if (unmounted) return;
        const message = timedOut
          ? "The news feed took too long to respond. Refresh to try again."
          : fetchError instanceof Error
            ? fetchError.message
            : "I could not load the feeds.";
        setArticles([]);
        setError(message);
      } finally {
        clearTimeout(timeoutId);
        if (!unmounted) setLoading(false);
      }
    }

    void loadFeeds();
    return () => {
      unmounted = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [hasUsableInitialFeed, reloadKey]);

  const filteredArticles = useMemo(
    () =>
      routeState.source === "all"
        ? articles
        : articles.filter((article) => article.source === routeState.source),
    [articles, routeState.source],
  );

  const trackedSourceCount = SOURCE_OPTIONS.length - 1;
  const articleSourceCount = useMemo(
    () => new Set(articles.map((article) => article.source)).size,
    [articles],
  );
  const updatedLabel = loading
    ? "Refreshing now"
    : error
      ? "Feed unavailable"
      : `Updated ${formatFetchedAt(fetchedAt)}`;

  const storyClusters = useMemo(
    () => (articles.length === 0 ? [] : clusterArticlesByStory(articles)),
    [articles],
  );
  const topClusterSize = useMemo(
    () => storyClusters.reduce((largest, cluster) => Math.max(largest, cluster.articles.length), 0),
    [storyClusters],
  );
  const topicClusters = useMemo(() => extractTopics(articles), [articles]);
  const sourceIds = useMemo(() => getOrderedSourcesForArticles(articles), [articles]);

  const lead = PROJECT_PRESS[NEWS_PULSE_ROUTE].lead;
  const standfirst =
    "I built News Pulse to get a fast read on what major outlets are choosing to emphasize right now. It pulls six RSS feeds into one editorial desk, then layers on lightweight topic, tone, readability, and story-cluster signals so I can compare framing before I read deeply.";

  return (
    <div data-testid="news-pulse-shell" aria-label="News Pulse Dashboard">
      <Catalog97ProjectHero
        ink={lead}
        title="News Pulse"
        standfirst={standfirst}
        meta={updatedLabel}
        readouts={[
          {
            label: "Headlines in pull",
            value: loading ? "—" : `${articles.length}`,
            detail: "From the most recent fetch",
          },
          {
            label: "Outlets reporting",
            value: loading ? "—" : `${articleSourceCount}`,
            detail: `${trackedSourceCount} outlets tracked`,
          },
          {
            label: "Largest story cluster",
            value: loading ? "—" : `${topClusterSize}`,
            detail: "Outlets on the same story",
          },
        ]}
      >
        <NewsFrontPage
          clusters={storyClusters}
          topics={topicClusters}
          outlets={sourceIds}
          dateline={
            loading ? "Refreshing now" : fetchedAt ? formatFetchedAt(fetchedAt) : "Waiting on a refresh"
          }
        />
      </Catalog97ProjectHero>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell">
          <h2 className="c97-poster-sm">The desk</h2>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="c97-segmented" role="tablist" aria-label="News Pulse tabs">
              {VIEW_OPTIONS.map((view) => (
                <button
                  key={view}
                  type="button"
                  role="tab"
                  id={`news-pulse-tab-${view}`}
                  aria-controls={`news-pulse-tabpanel-${view}`}
                  aria-selected={routeState.view === view}
                  tabIndex={routeState.view === view ? 0 : -1}
                  onClick={() => updateRouteState({ view })}
                  className="min-h-[44px] text-sm font-semibold"
                >
                  {VIEW_LABELS[view]}
                </button>
              ))}
            </div>

            {routeState.view === "headlines" ? (
              <SourceDropdown
                value={routeState.source}
                onValueChange={(source) => updateRouteState({ source })}
              />
            ) : null}
          </div>

          {feedErrors.length > 0 && !loading && !error ? (
            <div
              role="status"
              aria-live="polite"
              className="mt-5 flex items-start gap-3 border px-5 py-4"
              style={{
                borderColor: "color-mix(in srgb, var(--c97-accent) 30%, var(--c97-rule))",
                background: "color-mix(in srgb, var(--c97-accent) 10%, var(--c97-field))",
              }}
            >
              <CircleAlert
                className="mt-0.5 h-5 w-5 shrink-0"
                style={{ color: "var(--c97-accent)" }}
                aria-hidden="true"
              />
              <div>
                <p className="mb-1 text-sm font-semibold" style={{ color: "var(--c97-ink)" }}>
                  Some feeds did not come through on this refresh.
                </p>
                <p className="mb-0 text-sm leading-7" style={{ color: "var(--c97-ink-2)" }}>
                  {feedErrors.join("; ")}
                </p>
              </div>
            </div>
          ) : null}

          <div
            className="mt-6"
            role="tabpanel"
            id={`news-pulse-tabpanel-${routeState.view}`}
            aria-labelledby={`news-pulse-tab-${routeState.view}`}
          >
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
            ) : routeState.view === "headlines" ? (
              <HeadlinesView articles={filteredArticles} />
            ) : routeState.view === "coverage" ? (
              <CoverageView articles={articles} topics={topicClusters} />
            ) : (
              <AnalysisView articles={articles} />
            )}
          </div>

          {fetchedAt && !loading && !error ? (
            <p className="c97-meta" style={{ marginTop: "var(--c97-sp-6)", justifyContent: "center" }}>
              Last fetched {formatFetchedAt(fetchedAt)} · {articles.length} headlines across{" "}
              {articleSourceCount || trackedSourceCount} sources
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function LoadingState() {
  return (
    <div role="status" className="c97-panel" style={{ padding: "var(--c97-sp-5)" }}>
      <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>
        Refreshing live feeds
      </p>
      <p className="c97-prose mb-0">
        I am pulling the latest RSS headlines now so the dashboard can rebuild the digest and
        comparison views.
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="c97-panel" style={{ padding: "var(--c97-sp-5)" }}>
      <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>
        I could not load the feeds.
      </p>
      <p className="c97-prose mb-0">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="c97-btn-outline"
        style={{ marginTop: "var(--c97-sp-3)" }}
      >
        Try again
      </button>
    </div>
  );
}

const HEADLINES_PAGE_SIZE = 24;

function groupByOutlet(articles: NewsArticle[]): { source: NewsFeedId; items: NewsArticle[] }[] {
  const bySource = new Map<NewsFeedId, NewsArticle[]>();
  for (const article of articles) {
    const list = bySource.get(article.source) ?? [];
    list.push(article);
    bySource.set(article.source, list);
  }
  return NEWS_SOURCE_IDS.filter((source) => bySource.has(source)).map((source) => ({
    source,
    items: bySource.get(source)!,
  }));
}

function HeadlinesView({ articles }: { articles: NewsArticle[] }) {
  const [visibleCount, setVisibleCount] = useState(HEADLINES_PAGE_SIZE);
  // Reset when the underlying article set changes (source filter, refresh).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset pagination cursor when the underlying article set changes
    setVisibleCount(HEADLINES_PAGE_SIZE);
  }, [articles]);

  if (articles.length === 0) {
    return (
      <div className="c97-panel" style={{ padding: "var(--c97-sp-5)" }}>
        <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>
          No headlines match this filter.
        </p>
        <p className="c97-prose mb-0">
          That source did not return any articles in the current pull, so there is nothing to
          compare yet.
        </p>
      </div>
    );
  }

  const visibleArticles = articles.slice(0, visibleCount);
  const hasMore = visibleCount < articles.length;
  const columns = groupByOutlet(visibleArticles);

  return (
    <>
      <div
        data-testid="news-headlines-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
          gap: "var(--c97-sp-6)",
        }}
      >
        {columns.map(({ source, items }) => (
          <div key={source} style={{ minWidth: 0 }}>
            <p
              className="c97-kicker"
              style={{
                marginBottom: "var(--c97-sp-3)",
                borderBottom: "1px solid var(--c97-rule)",
                paddingBottom: "var(--c97-sp-2)",
              }}
            >
              {SOURCE_META[source].name}
            </p>
            <ul
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "var(--c97-sp-4)",
                margin: 0,
                padding: 0,
                listStyle: "none",
              }}
            >
              {items.map((article) => (
                <li key={article.link} style={{ minWidth: 0 }}>
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "block", textDecoration: "none" }}
                  >
                    <h2
                      className="c97-serif"
                      style={{ fontSize: "var(--c97-fs-h3)", overflowWrap: "anywhere" }}
                    >
                      {article.title}
                    </h2>
                    <p className="c97-meta" style={{ marginTop: "var(--c97-sp-1)" }}>
                      {timeAgo(article.pubDate)}
                      {article.category && article.category !== "General" ? ` · ${article.category}` : ""}
                    </p>
                    {article.description ? (
                      <p
                        className="c97-prose"
                        style={{
                          marginTop: "var(--c97-sp-2)",
                          fontSize: "var(--c97-fs-small)",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {article.description}
                      </p>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {hasMore ? (
        <div style={{ marginTop: "var(--c97-sp-6)", textAlign: "center" }}>
          <p className="c97-meta" style={{ justifyContent: "center" }}>
            Showing {visibleCount} of {articles.length} headlines.
          </p>
          <button
            type="button"
            onClick={() => setVisibleCount((current) => current + HEADLINES_PAGE_SIZE)}
            className="c97-btn-outline"
            style={{ marginTop: "var(--c97-sp-2)" }}
          >
            Show more
          </button>
        </div>
      ) : null}
    </>
  );
}

function CoverageView({
  articles,
  topics,
}: {
  articles: NewsArticle[];
  topics: TopicCluster[];
}) {
  const sourceIds = useMemo(() => getOrderedSourcesForArticles(articles), [articles]);
  const storyClusters = useMemo(() => clusterArticlesByStory(articles), [articles]);
  const maxTopicCount = topics.reduce((max, topic) => Math.max(max, topic.count), 0);

  if (topics.length === 0 && storyClusters.length === 0) {
    return (
      <div className="c97-panel" style={{ padding: "var(--c97-sp-5)" }}>
        <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>
          The cross-outlet overlap is thin right now.
        </p>
        <p className="c97-prose mb-0">
          I need at least two outlets on the same storyline before this view becomes useful.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "var(--c97-sp-6)" }}>
      {topics.length > 0 ? (
        <div>
          <h2 className="c97-poster-sm">Trending topics</h2>
          <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-3)" }}>
            What the newsrooms keep saying
          </p>
          <p className="c97-prose" style={{ marginTop: "var(--c97-sp-1)" }}>
            The words showing up across multiple outlets right now, ranked by how many headlines
            mention them. The dots show which outlets are on each.
          </p>
          <ol style={{ marginTop: "var(--c97-sp-4)", display: "grid", gap: "var(--c97-sp-2)", padding: 0, listStyle: "none" }}>
            {topics.map((topic, index) => {
              const pct =
                maxTopicCount > 0
                  ? Math.max(8, Math.round((topic.count / maxTopicCount) * 100))
                  : 0;
              const coveringSources = sourceIds.filter(
                (source) => (topic.sources[source] ?? 0) > 0,
              );
              return (
                <li
                  key={topic.topic}
                  className="grid items-center gap-3 border p-3 sm:grid-cols-[1.75rem_minmax(0,1fr)_auto]"
                  style={{ borderColor: "var(--c97-rule)", background: "var(--c97-field)" }}
                >
                  <span className="c97-mono text-sm font-semibold" style={{ color: "var(--c97-ink-2)" }}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-semibold capitalize" style={{ color: "var(--c97-ink)" }}>
                        {topic.topic}
                      </span>
                      <span className="c97-mono shrink-0 text-xs" style={{ color: "var(--c97-ink-2)" }}>
                        {topic.count} headlines
                      </span>
                    </div>
                    <span className="mt-1.5 block h-1.5 overflow-hidden" style={{ background: "var(--c97-rule)" }}>
                      <span className="block h-full" style={{ width: `${pct}%`, background: "var(--c97-accent)" }} />
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                    {coveringSources.map((source) => (
                      <span
                        key={source}
                        className="h-2.5 w-2.5"
                        style={{ background: SOURCE_META[source].color }}
                        title={`${SOURCE_META[source].name} · ${topic.sources[source]} headlines`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}

      {storyClusters.length > 0 ? (
        <div>
          <h2 className="c97-poster-sm">Story clusters across outlets</h2>
          <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-3)" }}>
            Coverage map
          </p>
          <p className="c97-prose" style={{ marginTop: "var(--c97-sp-1)" }}>
            This view groups similar headlines into storylines so I can compare overlap, not just
            repeated vocabulary.
          </p>

          <div
            className="mt-6 overflow-x-auto"
            role="region"
            aria-label="Story clusters by outlet (scrollable)"
            tabIndex={0}
          >
            <table className="c97-table" style={{ minWidth: "920px" }} aria-label="Story clusters by outlet">
              <thead>
                <tr>
                  <th scope="col">Story cluster</th>
                  {sourceIds.map((source) => (
                    <th key={source} scope="col" style={{ textAlign: "center" }}>
                      <span className="c97-chip" style={getSourceBadgeStyle(SOURCE_META[source].color)}>
                        <span
                          className="h-2.5 w-2.5"
                          style={{ background: SOURCE_META[source].color }}
                          aria-hidden="true"
                        />
                        {SOURCE_META[source].name}
                      </span>
                    </th>
                  ))}
                  <th scope="col" style={{ textAlign: "center" }}>
                    Total
                  </th>
                  <th scope="col">Representative headline</th>
                </tr>
              </thead>
              <tbody>
                {storyClusters.map((cluster) => (
                  <tr key={cluster.id}>
                    <td style={{ fontWeight: 600, color: "var(--c97-ink)" }}>{cluster.label}</td>
                    {sourceIds.map((source) => {
                      const count = cluster.sources[source] ?? 0;
                      return (
                        <td key={source} style={{ textAlign: "center" }}>
                          {count > 0 ? (
                            <span
                              className="c97-mono"
                              style={{ color: "var(--c97-ink)", opacity: Math.min(0.42 + count * 0.14, 1) }}
                            >
                              {count}
                            </span>
                          ) : (
                            <span style={{ color: "var(--c97-ink-2)" }}>—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="c97-mono" style={{ textAlign: "center", fontWeight: 700, color: "var(--c97-ink)" }}>
                      {cluster.totalCount}
                    </td>
                    <td>
                      <a
                        href={cluster.representative.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-start gap-2"
                        style={{ textDecoration: "none" }}
                      >
                        <span className="text-sm font-semibold" style={{ color: "var(--c97-ink)" }}>
                          {cluster.representative.title}
                        </span>
                        <ExternalLink
                          className="mt-0.5 h-3.5 w-3.5 shrink-0"
                          style={{ color: "var(--c97-accent)" }}
                          aria-hidden="true"
                        />
                      </a>
                      <p className="c97-meta" style={{ marginTop: "var(--c97-sp-1)" }}>
                        {cluster.representative.sourceName}
                        {cluster.representative.pubDate
                          ? ` · ${timeAgo(cluster.representative.pubDate)}`
                          : ""}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AnalysisView({ articles }: { articles: NewsArticle[] }) {
  const sourceIds = useMemo(() => getOrderedSourcesForArticles(articles), [articles]);

  const sentimentBySource = useMemo(() => {
    const sentimentMap: Record<
      string,
      { positive: number; negative: number; neutral: number; total: number }
    > = {};

    for (const article of articles) {
      const sentiment = analyzeSentiment(`${article.title} ${article.description}`);
      if (!sentimentMap[article.source]) {
        sentimentMap[article.source] = {
          positive: 0,
          negative: 0,
          neutral: 0,
          total: 0,
        };
      }

      sentimentMap[article.source][sentiment.label]++;
      sentimentMap[article.source].total++;
    }

    return sentimentMap;
  }, [articles]);

  const headlineLengthBySource = useMemo(() => {
    const lengthMap: Record<string, { totalLength: number; count: number }> = {};

    for (const article of articles) {
      if (!lengthMap[article.source]) {
        lengthMap[article.source] = { totalLength: 0, count: 0 };
      }

      lengthMap[article.source].totalLength += article.title.split(/\s+/).length;
      lengthMap[article.source].count++;
    }

    return lengthMap;
  }, [articles]);

  const readabilityBySource = useMemo(() => {
    const readabilityMap: Record<string, { totalScore: number; count: number }> = {};

    for (const article of articles) {
      const readability = calculateReadingLevel(article.title);
      if (!readabilityMap[article.source]) {
        readabilityMap[article.source] = { totalScore: 0, count: 0 };
      }

      readabilityMap[article.source].totalScore += readability.score;
      readabilityMap[article.source].count++;
    }

    return readabilityMap;
  }, [articles]);

  const maxAverageHeadlineLength = Math.max(
    ...sourceIds.map((source) => {
      const sourceData = headlineLengthBySource[source];
      return sourceData ? sourceData.totalLength / sourceData.count : 0;
    }),
    1,
  );

  if (sourceIds.length === 0) {
    return (
      <div className="c97-panel" style={{ padding: "var(--c97-sp-5)" }}>
        <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>
          There is no analysis to compare yet.
        </p>
        <p className="c97-prose mb-0">
          The dashboard needs headline data before it can calculate tone, length, and readability
          by outlet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="c97-panel" style={{ padding: "var(--c97-sp-5)" }}>
        <h2 className="c97-poster-sm">Tone distribution by outlet</h2>
        <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-3)" }}>
          Headline sentiment
        </p>
        <p className="c97-prose" style={{ marginTop: "var(--c97-sp-1)" }}>
          I read this as directional framing pressure, not article-level sentiment.
        </p>

        <div className="mt-6 space-y-5">
          {sourceIds.map((source) => {
            const sourceData = sentimentBySource[source];
            if (!sourceData) return null;

            const positivePercent = Math.round((sourceData.positive / sourceData.total) * 100);
            const negativePercent = Math.round((sourceData.negative / sourceData.total) * 100);
            const neutralPercent = 100 - positivePercent - negativePercent;

            return (
              <div key={source}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold" style={{ color: "var(--c97-ink)" }}>
                    {SOURCE_META[source].name}
                  </span>
                  <span className="c97-mono text-2xs" style={{ color: "var(--c97-ink-2)" }}>
                    {sourceData.total} headlines
                  </span>
                </div>

                <div className="flex h-5 w-full overflow-hidden" style={{ background: "var(--c97-field)" }}>
                  <div style={{ width: `${positivePercent}%`, background: "var(--c97-positive)" }} title={`Positive ${positivePercent}%`} />
                  <div style={{ width: `${neutralPercent}%`, background: "var(--c97-rule)" }} title={`Neutral ${neutralPercent}%`} />
                  <div style={{ width: `${negativePercent}%`, background: "var(--c97-negative)" }} title={`Negative ${negativePercent}%`} />
                </div>

                <div
                  className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-2xs font-semibold uppercase tracking-[0.12em]"
                  style={{ color: "var(--c97-ink-2)" }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5" style={{ background: "var(--c97-positive)" }} aria-hidden="true" />
                    {positivePercent}% positive
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5" style={{ background: "var(--c97-rule)" }} aria-hidden="true" />
                    {neutralPercent}% neutral
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5" style={{ background: "var(--c97-negative)" }} aria-hidden="true" />
                    {negativePercent}% negative
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="c97-panel" style={{ padding: "var(--c97-sp-5)" }}>
        <h2 className="c97-poster-sm">Average words per headline</h2>
        <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-3)" }}>
          Headline length
        </p>
        <p className="c97-prose" style={{ marginTop: "var(--c97-sp-1)" }}>
          Longer headlines usually signal more context, but sometimes they just mean more hedging.
        </p>

        <div className="mt-6 space-y-5">
          {sourceIds.map((source) => {
            const sourceData = headlineLengthBySource[source];
            if (!sourceData) return null;

            const averageLength = sourceData.totalLength / sourceData.count;
            const widthPercent = (averageLength / maxAverageHeadlineLength) * 100;

            return (
              <div key={source}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold" style={{ color: "var(--c97-ink)" }}>
                    {SOURCE_META[source].name}
                  </span>
                  <span className="c97-mono text-sm" style={{ color: "var(--c97-ink-2)" }}>
                    {averageLength.toFixed(1)} words
                  </span>
                </div>

                <div className="h-4 w-full overflow-hidden" style={{ background: "var(--c97-field)" }}>
                  <div className="h-full" style={{ width: `${widthPercent}%`, background: SOURCE_META[source].color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="c97-panel lg:col-span-2" style={{ padding: "var(--c97-sp-5)" }}>
        <h2 className="c97-poster-sm">How dense the headline writing feels</h2>
        <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-3)" }}>
          Readability
        </p>
        <p className="c97-prose" style={{ marginTop: "var(--c97-sp-1)" }}>
          Higher scores are easier to scan quickly. Lower scores usually mean denser wording or
          more clauses packed into the headline.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sourceIds.map((source) => {
            const sourceData = readabilityBySource[source];
            if (!sourceData) return null;

            const averageScore = Math.round(sourceData.totalScore / sourceData.count);
            const readabilityLabel =
              averageScore >= 70 ? "Easy" : averageScore >= 50 ? "Moderate" : "Advanced";

            return (
              <div
                key={source}
                className="border px-4 py-4"
                style={{ borderColor: "var(--c97-rule)", background: "var(--c97-field)" }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="c97-mono flex h-12 w-12 items-center justify-center text-base font-semibold"
                    style={{ color: "var(--c97-surface)", background: SOURCE_META[source].color }}
                  >
                    {averageScore}
                  </div>

                  <div>
                    <p className="mb-1 text-sm font-semibold" style={{ color: "var(--c97-ink)" }}>
                      {SOURCE_META[source].name}
                    </p>
                    <p
                      className="mb-0 text-2xs font-semibold uppercase tracking-[0.12em]"
                      style={getReadabilityTone(averageScore)}
                    >
                      {readabilityLabel}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
