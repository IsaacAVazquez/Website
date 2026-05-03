"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, CircleAlert, ExternalLink } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EditorialPillButton,
  InlineSectionLead,
  StatusPanel,
  getPillStyle,
  insetPanelStyle,
} from "@/components/editorial";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SOURCE_META } from "@/lib/news-pulse-sources";
import type { NewsArticle } from "@/lib/news-pulse-utils";
import {
  analyzeSentiment,
  calculateReadingLevel,
  clusterArticlesByStory,
  getOrderedSourcesForArticles,
} from "@/lib/news-pulse-utils";
import {
  buildNewsPulseHref,
  normalizeNewsPulseState,
  SOURCE_LABELS,
  SOURCE_OPTIONS,
  VIEW_LABELS,
  VIEW_OPTIONS,
  type NewsPulseSearchState,
  type NewsSource,
} from "./news-pulse-state";

interface NewsPulseClientProps {
  initialState: NewsPulseSearchState;
}

interface FeedResponse {
  articles: NewsArticle[];
  fetchedAt: string;
  errors: string[];
  message?: string;
}

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const noMotion = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
};

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
    color: "var(--home-ink)",
    borderColor: "color-mix(in srgb, var(--home-stone) 58%, var(--home-rule))",
    background: `color-mix(in srgb, ${sourceColor} 12%, var(--home-paper))`,
  };
}

function getReadabilityTone(score: number): CSSProperties {
  if (score >= 70) return { color: "var(--home-moss)" };
  if (score >= 50) return { color: "var(--home-haze)" };
  return { color: "var(--home-ink-muted)" };
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
 * Radix DropdownMenu handles Esc-to-close, click-outside dismiss, focus trap
 * while open, and focus return to the trigger on close — verified against the
 * @radix-ui/react-dropdown-menu source. Trigger ARIA attrs (aria-haspopup,
 * aria-expanded, aria-controls) are forwarded automatically via `asChild`.
 */
function SourceDropdown({
  value,
  onValueChange,
}: {
  value: NewsSource;
  onValueChange: (value: NewsSource) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-200 ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
          style={getPillStyle(false)}
          aria-label={`Source selector: ${SOURCE_LABELS[value]}`}
        >
          <span
            className="text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
            style={{ fontFamily: "var(--font-home-sans)" }}
          >
            Source
          </span>
          <span>{SOURCE_LABELS[value]}</span>
          <ChevronDown
            className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[14rem] rounded-[1rem] border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,white)] p-1.5 text-[var(--home-ink)] shadow-[var(--shadow-lg)]"
      >
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextValue) => onValueChange(nextValue as NewsSource)}
        >
          {SOURCE_OPTIONS.map((source) => (
            <DropdownMenuRadioItem
              key={source}
              value={source}
              className="rounded-[0.8rem] py-2 pl-8 pr-3 text-sm font-medium focus:bg-[color-mix(in_srgb,var(--home-paper-alt)_90%,white)]"
              style={{ fontFamily: "var(--font-home-sans)" }}
            >
              {SOURCE_LABELS[source]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function NewsPulseClient({ initialState }: NewsPulseClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? noMotion : fadeIn;

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

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedErrors, setFeedErrors] = useState<string[]>([]);
  const [fetchedAt, setFetchedAt] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let timedOut = false;
    let unmounted = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);

    async function loadFeeds() {
      setLoading(true);
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
  }, []);

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

  return (
    <section
      className="home-page min-h-screen"
      aria-label="News Pulse Dashboard"
      data-testid="news-pulse-shell"
    >
      <div className="home-shell home-section space-y-4 sm:space-y-5">
        <motion.div
          className="space-y-3 pt-2"
          variants={variants}
          initial="hidden"
          animate="visible"
        >
          <div className="space-y-3">
            <h1
              style={{
                fontFamily: "var(--font-home-sans)",
                fontSize: "clamp(2.55rem, 6vw, 4.8rem)",
                fontWeight: 600,
                lineHeight: 0.92,
                letterSpacing: "-0.08em",
                color: "var(--home-ink)",
              }}
            >
              News Pulse
            </h1>

            <p className="home-body max-w-[42rem]">
              I built News Pulse to get a fast read on what major outlets are choosing to
              emphasize right now. It pulls six RSS feeds into one editorial desk, then layers on
              lightweight topic, tone, readability, and story-cluster signals so I can compare
              framing before I read deeply.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="resume-chip">{trackedSourceCount} outlets tracked</span>
              <span className="resume-chip">{updatedLabel}</span>
              <span className="resume-chip">Headline-level topics, tone, readability, clusters</span>
              {!loading && !error ? (
                <span className="resume-chip">{articles.length} headlines in this pull</span>
              ) : null}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="pt-1"
          variants={variants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div
              className="flex flex-wrap gap-2 rounded-[1.1rem] p-1.5"
              role="tablist"
              aria-label="News Pulse tabs"
              style={{ width: "fit-content" }}
            >
              {VIEW_OPTIONS.map((view) => (
                <EditorialPillButton
                  key={view}
                  active={routeState.view === view}
                  onClick={() => updateRouteState({ view })}
                  role="tab"
                  ariaSelected={routeState.view === view}
                >
                  {VIEW_LABELS[view]}
                </EditorialPillButton>
              ))}
            </div>

            {routeState.view === "headlines" ? (
              <SourceDropdown
                value={routeState.source}
                onValueChange={(source) => updateRouteState({ source })}
              />
            ) : null}
          </div>
        </motion.div>

        {feedErrors.length > 0 && !loading && !error ? (
          <div
            role="status"
            aria-live="polite"
            className="home-card flex items-start gap-3 rounded-[1.5rem] px-5 py-4"
            style={{
              borderColor: "color-mix(in srgb, var(--home-acid) 30%, var(--home-rule))",
              background: "color-mix(in srgb, var(--home-acid) 10%, var(--home-paper))",
            }}
          >
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))" }}
            >
              <CircleAlert
                className="h-4 w-4"
                style={{ color: "var(--home-acid)" }}
                aria-hidden="true"
              />
            </div>
            <div>
              <p
                className="mb-1 text-sm font-semibold"
                style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink)" }}
              >
                Some feeds did not come through on this refresh.
              </p>
              <p
                className="mb-0 max-w-none text-sm leading-7"
                style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
              >
                {feedErrors.join("; ")}
              </p>
            </div>
          </div>
        ) : null}

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : routeState.view === "headlines" ? (
          <HeadlinesView articles={filteredArticles} variants={variants} />
        ) : routeState.view === "coverage" ? (
          <CoverageView articles={articles} variants={variants} />
        ) : (
          <AnalysisView articles={articles} variants={variants} />
        )}

        {fetchedAt && !loading && !error ? (
          <p
            className="mb-0 pt-1 text-center text-xs"
            style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
          >
            Last fetched {formatFetchedAt(fetchedAt)} · {articles.length} headlines across{" "}
            {articleSourceCount || trackedSourceCount} sources
          </p>
        ) : null}
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <StatusPanel
      title="Refreshing live feeds"
      message="I am pulling the latest RSS headlines now so the dashboard can rebuild the digest and comparison views."
      icon={
        <div
          className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      }
      statusRole="status"
    />
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <StatusPanel
      title="I could not load the feeds."
      message={message}
      tone="error"
      icon={<CircleAlert className="h-5 w-5" aria-hidden="true" />}
      statusRole="alert"
    />
  );
}

const HEADLINES_PAGE_SIZE = 24;

function HeadlinesView({
  articles,
  variants,
}: {
  articles: NewsArticle[];
  variants: typeof fadeIn;
}) {
  const [visibleCount, setVisibleCount] = useState(HEADLINES_PAGE_SIZE);
  // Reset when the underlying article set changes (source filter, refresh).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset pagination cursor when the underlying article set changes
    setVisibleCount(HEADLINES_PAGE_SIZE);
  }, [articles]);

  if (articles.length === 0) {
    return (
      <StatusPanel
        title="No headlines match this filter."
        message="That source did not return any articles in the current pull, so there is nothing to compare yet."
      />
    );
  }

  const visibleArticles = articles.slice(0, visibleCount);
  const hasMore = visibleCount < articles.length;

  return (
    <>
    <motion.div
      className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      {visibleArticles.map((article) => (
        <a
          key={`${article.source}-${article.link}`}
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="home-card group flex h-full flex-col no-underline"
          style={{ padding: "1.5rem" }}
        >
          <div className="flex items-start justify-between gap-3">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
              style={getSourceBadgeStyle(article.sourceColor)}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: article.sourceColor }}
                aria-hidden="true"
              />
              {article.sourceName}
            </span>

            <span
              className="shrink-0 text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
              style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
            >
              {timeAgo(article.pubDate)}
            </span>
          </div>

          <div className="mt-5 flex-1 space-y-3">
            <h2
              className="text-[1.2rem] leading-[1.15] transition-colors duration-200 ease group-hover:text-[var(--home-haze)]"
              style={{
                fontFamily: "var(--font-home-sans)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--home-ink)",
              }}
            >
              {article.title}
            </h2>

            {article.description ? (
              <p
                className="mb-0 line-clamp-3 text-sm leading-7"
                style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
              >
                {article.description}
              </p>
            ) : null}
          </div>

          <div
            className="mt-5 flex items-center justify-between gap-3 pt-4"
            style={{ borderTop: "1px solid var(--home-rule)" }}
          >
            {article.category && article.category !== "General" ? (
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
                style={{
                  fontFamily: "var(--font-home-sans)",
                  color: "var(--home-ink)",
                  background: "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
                }}
              >
                {article.category}
              </span>
            ) : (
              <span
                className="text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
                style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
              >
                Open feed item
              </span>
            )}

            <span
              className="inline-flex items-center gap-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
              style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-haze)" }}
            >
              Read headline
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </div>
        </a>
      ))}
    </motion.div>
    {hasMore ? (
      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-xs text-[var(--home-ink-muted)]">
          Showing {visibleCount} of {articles.length} headlines.
        </p>
        <button
          type="button"
          onClick={() => setVisibleCount((current) => current + HEADLINES_PAGE_SIZE)}
          className="home-button home-button-secondary"
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
  variants,
}: {
  articles: NewsArticle[];
  variants: typeof fadeIn;
}) {
  const sourceIds = useMemo(() => getOrderedSourcesForArticles(articles), [articles]);
  const storyClusters = useMemo(() => clusterArticlesByStory(articles), [articles]);

  if (storyClusters.length === 0) {
    return (
      <StatusPanel
        title="The cross-outlet overlap is thin right now."
        message="I need at least two outlets on the same storyline before this view becomes useful."
      />
    );
  }

  return (
    <motion.div className="space-y-6" variants={variants} initial="hidden" animate="visible">
      <div className="home-card p-5 sm:p-6">
        <h2
          className="text-xl font-semibold"
          style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink)" }}
        >
          Story clusters across outlets
        </h2>
        <InlineSectionLead kicker="Coverage map">
          This view groups similar headlines into storylines so I can compare overlap, not just
          repeated vocabulary.
        </InlineSectionLead>

        <div
          className="scroll-shadow-x mt-6 overflow-x-auto rounded-[20px]"
          role="region"
          aria-label="Story clusters by outlet (scrollable)"
          tabIndex={0}
        >
          <table
            className="min-w-[920px] w-full text-left text-sm"
            aria-label="Story clusters by outlet"
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--home-rule)" }}>
                <th
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em]"
                  style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
                >
                  Story cluster
                </th>
                {sourceIds.map((source) => (
                  <th key={source} className="px-3 py-3 text-center">
                    <span
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
                      style={getSourceBadgeStyle(SOURCE_META[source].color)}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: SOURCE_META[source].color }}
                        aria-hidden="true"
                      />
                      {SOURCE_META[source].name}
                    </span>
                  </th>
                ))}
                <th
                  className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em]"
                  style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
                >
                  Total
                </th>
                <th
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em]"
                  style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
                >
                  Representative headline
                </th>
              </tr>
            </thead>
            <tbody>
              {storyClusters.map((cluster) => (
                <tr key={cluster.id} style={{ borderBottom: "1px solid var(--home-rule)" }}>
                  <td
                    className="px-4 py-4"
                    style={{
                      fontFamily: "var(--font-home-sans)",
                      fontWeight: 600,
                      color: "var(--home-ink)",
                    }}
                  >
                    {cluster.label}
                  </td>
                  {sourceIds.map((source) => {
                    const count = cluster.sources[source] ?? 0;
                    return (
                      <td key={source} className="px-3 py-4 text-center">
                        {count > 0 ? (
                          <span
                            className="inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-semibold"
                            style={{
                              fontFamily: "var(--font-home-sans)",
                              color: "white",
                              background: SOURCE_META[source].color,
                              opacity: Math.min(0.42 + count * 0.14, 1),
                            }}
                          >
                            {count}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontFamily: "var(--font-home-sans)",
                              color: "var(--home-ink-muted)",
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td
                    className="px-4 py-4 text-center"
                    style={{
                      fontFamily: "var(--font-home-sans)",
                      fontWeight: 700,
                      color: "var(--home-ink)",
                    }}
                  >
                    {cluster.totalCount}
                  </td>
                  <td className="px-4 py-4">
                    <a
                      href={cluster.representative.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-start gap-2 no-underline"
                    >
                      <span
                        className="text-sm font-semibold transition-colors duration-200 ease group-hover:text-[var(--home-haze)]"
                        style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink)" }}
                      >
                        {cluster.representative.title}
                      </span>
                      <ExternalLink
                        className="mt-0.5 h-3.5 w-3.5 shrink-0"
                        style={{ color: "var(--home-haze)" }}
                        aria-hidden="true"
                      />
                    </a>
                    <p
                      className="mb-0 mt-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        fontFamily: "var(--font-home-sans)",
                        color: "var(--home-ink-muted)",
                      }}
                    >
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
    </motion.div>
  );
}

function AnalysisView({
  articles,
  variants,
}: {
  articles: NewsArticle[];
  variants: typeof fadeIn;
}) {
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
      <StatusPanel
        title="There is no analysis to compare yet."
        message="The dashboard needs headline data before it can calculate tone, length, and readability by outlet."
      />
    );
  }

  return (
    <motion.div
      className="grid gap-6 lg:grid-cols-2"
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      <div className="home-card p-5 sm:p-6">
        <h2
          className="text-xl font-semibold"
          style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink)" }}
        >
          Tone distribution by outlet
        </h2>
        <InlineSectionLead kicker="Headline sentiment">
          I read this as directional framing pressure, not article-level sentiment.
        </InlineSectionLead>

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
                  <span
                    className="text-sm font-semibold"
                    style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink)" }}
                  >
                    {SOURCE_META[source].name}
                  </span>
                  <span
                    className="text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
                    style={{
                      fontFamily: "var(--font-home-sans)",
                      color: "var(--home-ink-muted)",
                    }}
                  >
                    {sourceData.total} headlines
                  </span>
                </div>

                <div
                  className="flex h-5 w-full overflow-hidden rounded-full"
                  style={{ background: "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))" }}
                >
                  <div
                    className="transition-[width] duration-500 ease"
                    style={{ width: `${positivePercent}%`, background: "var(--home-moss)" }}
                    title={`Positive ${positivePercent}%`}
                  />
                  <div
                    className="transition-[width] duration-500 ease"
                    style={{ width: `${neutralPercent}%`, background: "var(--home-stone)" }}
                    title={`Neutral ${neutralPercent}%`}
                  />
                  <div
                    className="transition-[width] duration-500 ease"
                    style={{ width: `${negativePercent}%`, background: "var(--home-haze)" }}
                    title={`Negative ${negativePercent}%`}
                  />
                </div>

                <div
                  className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
                  style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: "var(--home-moss)" }}
                      aria-hidden="true"
                    />
                    {positivePercent}% positive
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: "var(--home-stone)" }}
                      aria-hidden="true"
                    />
                    {neutralPercent}% neutral
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: "var(--home-haze)" }}
                      aria-hidden="true"
                    />
                    {negativePercent}% negative
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="home-card p-5 sm:p-6">
        <h2
          className="text-xl font-semibold"
          style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink)" }}
        >
          Average words per headline
        </h2>
        <InlineSectionLead kicker="Headline length">
          Longer headlines usually signal more context, but sometimes they just mean more hedging.
        </InlineSectionLead>

        <div className="mt-6 space-y-5">
          {sourceIds.map((source) => {
            const sourceData = headlineLengthBySource[source];
            if (!sourceData) return null;

            const averageLength = sourceData.totalLength / sourceData.count;
            const widthPercent = (averageLength / maxAverageHeadlineLength) * 100;

            return (
              <div key={source}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span
                    className="text-sm font-semibold"
                    style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink)" }}
                  >
                    {SOURCE_META[source].name}
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
                  >
                    {averageLength.toFixed(1)} words
                  </span>
                </div>

                <div
                  className="h-4 w-full overflow-hidden rounded-full"
                  style={{ background: "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))" }}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-500 ease"
                    style={{
                      width: `${widthPercent}%`,
                      background: SOURCE_META[source].color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="home-card p-5 sm:p-6 lg:col-span-2">
        <h2
          className="text-xl font-semibold"
          style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink)" }}
        >
          How dense the headline writing feels
        </h2>
        <InlineSectionLead kicker="Readability">
          Higher scores are easier to scan quickly. Lower scores usually mean denser wording or
          more clauses packed into the headline.
        </InlineSectionLead>

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
                className="rounded-[1.25rem] px-4 py-4"
                style={insetPanelStyle}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-base font-semibold"
                    style={{
                      fontFamily: "var(--font-home-sans)",
                      color: "white",
                      background: SOURCE_META[source].color,
                    }}
                  >
                    {averageScore}
                  </div>

                  <div>
                    <p
                      className="mb-1 text-sm font-semibold"
                      style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink)" }}
                    >
                      {SOURCE_META[source].name}
                    </p>
                    <p
                      className="mb-0 text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        ...getReadabilityTone(averageScore),
                        fontFamily: "var(--font-home-sans)",
                      }}
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
    </motion.div>
  );
}

