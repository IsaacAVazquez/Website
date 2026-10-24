"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, CircleAlert } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  NEWS_SOURCE_IDS,
  SOURCE_META,
  type NewsFeedId,
} from "@/lib/news-pulse-sources";
import type { NewsPulseFeedResponse } from "@/lib/newsPulseServer";
import type { NewsArticle } from "@/lib/news-pulse-utils";
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
  normalizeNewsPulseState,
  SOURCE_LABELS,
  SOURCE_OPTIONS,
  type NewsSource,
} from "./news-pulse-state";
import { DATE_TIME_FORMATTER, formatStableDateTime } from "@/lib/date-formatters";
import { useClientNow } from "@/hooks/useClientNow";
import "./news-pulse.css";
import { groupBy, relativeAge } from "@/lib/utils";

interface NewsPulseClientProps {
  initialFeed?: NewsPulseFeedResponse;
}

type FeedResponse = NewsPulseFeedResponse;

/** Fallback for relativeAge() while useClientNow() is still null (server render
 * and first hydration pass), so the pubDate always shows something true. */
function formatAbsolutePubDate(dateStr: string): string {
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? "" : formatStableDateTime(DATE_TIME_FORMATTER, date);
}

function formatFetchedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Waiting on a refresh"
    : formatStableDateTime(DATE_TIME_FORMATTER, date);
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
    <label className="np-select">
      <span className="np-kicker">Source</span>
      {/* The select itself is the touch target, so it fills the label's height rather than sitting 20px tall inside it. */}
      <select
        value={value}
        onChange={(event) => onValueChange(event.target.value as NewsSource)}
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

export function NewsPulseClient({ initialFeed }: NewsPulseClientProps) {
  const searchParams = useSearchParams();
  const routeState = useMemo(() => normalizeNewsPulseState(searchParams), [searchParams]);

  // The filter only narrows headlines the page already holds, so the choice is
  // a plain history entry. The router syncs useSearchParams from the native
  // call, where router.push waited on a server render of the whole page.
  function selectSource(source: NewsSource) {
    window.history.pushState(null, "", buildNewsPulseHref({ source }));
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
  const storyClusters = useMemo(
    () => (articles.length === 0 ? [] : clusterArticlesByStory(articles)),
    [articles],
  );
  const topicClusters = useMemo(() => extractTopics(articles), [articles]);
  const sourceIds = useMemo(() => getOrderedSourcesForArticles(articles), [articles]);
  const dateline = loading
    ? "Refreshing now"
    : error
      ? "Feed unavailable"
      : fetchedAt
        ? `Pulled ${formatFetchedAt(fetchedAt)}`
        : "Waiting on a refresh";

  return (
    <div className="np-root" data-testid="news-pulse-shell">
      <div className="c97-shell c97-frame np-page">
        <header className="np-masthead">
          <h1 className="np-nameplate">News Pulse</h1>
          <p className="np-standfirst">
            What {trackedSourceCount} newsrooms are leading with right now, which stories cross
            outlet lines, and how the headlines read, pulled from their RSS feeds.
          </p>
          <p className="np-dateline">
            <span>{dateline}</span>
            <span>
              {loading
                ? `${trackedSourceCount} outlets tracked`
                : `${articles.length} headlines from ${articleSourceCount} of ${trackedSourceCount} outlets`}
            </span>
          </p>
        </header>

        {feedErrors.length > 0 && !loading && !error ? (
          <div role="status" aria-live="polite" className="np-feed-errors">
            <CircleAlert className="np-feed-errors-icon" aria-hidden="true" />
            <div>
              <p className="np-strong">Some feeds did not come through on this refresh.</p>
              <p className="np-muted">{feedErrors.join("; ")}</p>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div role="status" className="np-state">
            <p className="np-kicker">Refreshing live feeds</p>
            <p>
              I am pulling the latest RSS headlines now so the front page, the headlines, and the
              tone table can rebuild.
            </p>
          </div>
        ) : error ? (
          <div role="alert" className="np-state">
            <p className="np-kicker">I could not load the feeds.</p>
            <p>{error}</p>
            <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="np-button">
              Try again
            </button>
          </div>
        ) : (
          <>
            <NewsFrontPage clusters={storyClusters} topics={topicClusters} outlets={sourceIds} />

            <section className="np-section" aria-labelledby="np-headlines-title">
              <div className="np-section-head">
                <h2 id="np-headlines-title" className="np-section-title">Headlines</h2>
                <SourceDropdown value={routeState.source} onValueChange={selectSource} />
              </div>
              <HeadlinesView articles={filteredArticles} />
            </section>

            <section className="np-section" aria-labelledby="np-tone-title">
              <div className="np-section-head">
                <h2 id="np-tone-title" className="np-section-title">Tone and density</h2>
                <p className="np-muted np-small">
                  I read this as a rough lean in how each outlet frames its headlines, and it
                  doesn&apos;t measure the sentiment of whole articles.
                  Higher readability scans faster.
                </p>
              </div>
              <ToneTable articles={articles} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}

const HEADLINES_PAGE_SIZE = 24;

function groupByOutlet(articles: NewsArticle[]): { source: NewsFeedId; items: NewsArticle[] }[] {
  const bySource = groupBy(articles, (article) => article.source);
  return NEWS_SOURCE_IDS.filter((source) => bySource.has(source)).map((source) => ({
    source,
    items: bySource.get(source)!,
  }));
}

function HeadlinesView({ articles }: { articles: NewsArticle[] }) {
  const now = useClientNow();
  const [visibleCount, setVisibleCount] = useState(HEADLINES_PAGE_SIZE);
  // Reset when the underlying article set changes (source filter, refresh).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset pagination cursor when the underlying article set changes
    setVisibleCount(HEADLINES_PAGE_SIZE);
  }, [articles]);

  if (articles.length === 0) {
    return (
      <div className="np-state">
        <p className="np-kicker">No headlines match this filter.</p>
        <p>
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
      <div data-testid="news-headlines-grid" className="np-columns">
        {columns.map(({ source, items }) => (
          <div key={source} className="np-column">
            <p className="np-column-head">
              <span className="np-swatch" style={{ background: SOURCE_META[source].color }} aria-hidden="true" />
              {SOURCE_META[source].name}
            </p>
            <ul className="np-column-list">
              {items.map((article) => (
                <li key={article.link}>
                  <a href={article.link} target="_blank" rel="noopener noreferrer" className="np-headline">
                    <h3 className="np-headline-title">{article.title}</h3>
                    <p className="np-muted np-small">
                      {now === null ? formatAbsolutePubDate(article.pubDate) : relativeAge(article.pubDate, now)}
                      {article.category && article.category !== "General" ? ` · ${article.category}` : ""}
                    </p>
                    {article.description ? <p className="np-dek">{article.description}</p> : null}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {hasMore ? (
        <div className="np-more-button">
          <p className="np-muted np-small">
            Showing {visibleCount} of {articles.length} headlines.
          </p>
          <button
            type="button"
            onClick={() => setVisibleCount((current) => current + HEADLINES_PAGE_SIZE)}
            className="np-button"
          >
            Show more
          </button>
        </div>
      ) : null}
    </>
  );
}

function ToneTable({ articles }: { articles: NewsArticle[] }) {
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
    return <p className="np-muted">There is no headline data to compare yet.</p>;
  }

  return (
    <div className="np-scroll" role="region" aria-label="Tone and density by outlet (scrollable)" tabIndex={0}>
      <table className="np-table np-tone">
        <caption className="sr-only">Tone and density by outlet</caption>
        <thead>
          <tr>
            <th scope="col">Outlet</th>
            <th scope="col" data-align="end">Headlines</th>
            <th scope="col">Tone</th>
            <th scope="col" data-align="end">Positive</th>
            <th scope="col" data-align="end">Neutral</th>
            <th scope="col" data-align="end">Negative</th>
            <th scope="col" data-align="end">Words per headline</th>
            <th scope="col" data-align="end">Readability</th>
          </tr>
        </thead>
        <tbody>
          {sourceIds.map((source) => {
            const tone = sentimentBySource[source];
            const length = headlineLengthBySource[source];
            const readability = readabilityBySource[source];
            if (!tone || !length || !readability) return null;
            const positive = Math.round((tone.positive / tone.total) * 100);
            const negative = Math.round((tone.negative / tone.total) * 100);
            const neutral = 100 - positive - negative;
            const words = length.totalLength / length.count;
            const score = Math.round(readability.totalScore / readability.count);
            const label = score >= 70 ? "Easy" : score >= 50 ? "Moderate" : "Advanced";
            return (
              <tr key={source}>
                <th scope="row">
                  <span className="np-outlet">
                    <span className="np-swatch" style={{ background: SOURCE_META[source].color }} aria-hidden="true" />
                    {SOURCE_META[source].name}
                  </span>
                </th>
                <td data-align="end">{tone.total}</td>
                <td>
                  <span className="np-tone-bar" aria-hidden="true">
                    <span style={{ width: `${positive}%`, background: "var(--np-positive)" }} />
                    <span style={{ width: `${neutral}%`, background: "var(--np-rule-strong)" }} />
                    <span style={{ width: `${negative}%`, background: "var(--np-negative)" }} />
                  </span>
                </td>
                <td data-align="end">{positive}%</td>
                <td data-align="end">{neutral}%</td>
                <td data-align="end">{negative}%</td>
                <td data-align="end">
                  <span className="np-length">
                    <span
                      className="np-length-bar"
                      style={{ width: `${(words / maxAverageHeadlineLength) * 4}rem` }}
                      aria-hidden="true"
                    />
                    {words.toFixed(1)}
                  </span>
                </td>
                <td data-align="end">
                  {score} <span className="np-muted">{label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
