"use client";

import React, { startTransition, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import type { NewsArticle } from "@/lib/news-pulse-utils";
import {
  analyzeSentiment,
  extractTopics,
  calculateReadingLevel,
  SOURCE_META,
} from "@/lib/news-pulse-utils";
import {
  buildNewsPulseHref,
  normalizeNewsPulseState,
  VIEW_OPTIONS,
  VIEW_LABELS,
  SOURCE_OPTIONS,
  SOURCE_LABELS,
  type NewsPulseSearchState,
  type NewsPulseView,
} from "./news-pulse-state";

// ── Types ───────────────────────────────────────────────────────────────────

interface NewsPulseClientProps {
  initialState: NewsPulseSearchState;
}

interface FeedResponse {
  articles: NewsArticle[];
  fetchedAt: string;
  errors: string[];
}

const VIEW_DESCRIPTIONS: Record<NewsPulseView, string> = {
  headlines: "Stream the latest article cards and filter by source.",
  coverage: "Compare topic overlap across outlets in a coverage matrix.",
  analysis: "Inspect sentiment, headline length, and readability metrics by outlet.",
};

// ── Animation helpers ───────────────────────────────────────────────────────

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const noMotion = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
};

// ── Relative time ───────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Main client ─────────────────────────────────────────────────────────────

export function NewsPulseClient({ initialState }: NewsPulseClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? noMotion : fadeIn;

  // Route state
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

  // Data fetching
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedErrors, setFeedErrors] = useState<string[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch("/api/news-pulse", { signal: controller.signal })
      .then((r) => r.json())
      .then((data: FeedResponse) => {
        setArticles(data.articles);
        setFetchedAt(data.fetchedAt);
        setFeedErrors(data.errors ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  // Filtered articles
  const filtered = useMemo(
    () =>
      routeState.source === "all"
        ? articles
        : articles.filter((a: NewsArticle) => a.source === routeState.source),
    [articles, routeState.source],
  );

  const shellClassName =
    "mx-auto w-full max-w-[1680px] px-4 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-10 lg:px-8 xl:px-10 2xl:px-12";

  return (
    <section
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--color-primary)_10%,transparent),transparent_28%),linear-gradient(180deg,var(--surface-primary)_0%,color-mix(in_srgb,var(--surface-secondary)_65%,var(--surface-primary))_100%)]"
      aria-label="News Pulse Dashboard"
    >
      <div className={shellClassName}>
        {/* ── Hero ─────────────────────────────────────────── */}
        <motion.div
          className="mb-8 rounded-[30px] border border-[color-mix(in_srgb,var(--color-primary)_12%,var(--border-primary))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_7%,var(--surface-elevated))_0%,var(--surface-elevated)_55%,color-mix(in_srgb,var(--color-success)_7%,var(--surface-elevated))_100%)] p-6 shadow-[var(--shadow-sm)] sm:p-8"
          variants={variants}
          initial="hidden"
          animate="visible"
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_auto] xl:items-end">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
                Media Intelligence
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                News Pulse Dashboard
              </h1>
              <p className="mt-3 max-w-[68ch] text-sm leading-7 text-[var(--text-secondary)] sm:text-[0.95rem]">
                Live feed aggregating headlines from 6 major news outlets. Explore coverage patterns,
                trending topics, and headline sentiment — all powered by RSS with client-side NLP.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
              <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  Sources
                </p>
                <p
                  className="mt-2 text-sm font-semibold text-[var(--text-primary)]"
                  title="Monitors six RSS feeds and unifies them into one normalized list."
                >
                  6 major outlets
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  Analysis
                </p>
                <p
                  className="mt-2 text-sm font-semibold text-[var(--text-primary)]"
                  title="Uses lightweight client-side NLP: topic extraction, lexicon sentiment, and readability estimates."
                >
                  Topics + Sentiment
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  Updates
                </p>
                <p
                  className="mt-2 text-sm font-semibold text-[var(--text-primary)]"
                  title="Refreshes whenever the RSS endpoint is queried and parsed."
                >
                  Live via RSS
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Tabs ─────────────────────────────────────────── */}
        <div
          className="mb-8 inline-flex flex-wrap gap-2 rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-elevated)]/90 p-2 shadow-[var(--shadow-sm)] backdrop-blur"
          role="tablist"
          aria-label="News Pulse tabs"
        >
          {VIEW_OPTIONS.map((key) => (
            <button
              key={key}
              role="tab"
              aria-selected={routeState.view === key}
              onClick={() => updateRouteState({ view: key })}
              title={VIEW_DESCRIPTIONS[key]}
              className={`min-h-[46px] rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                routeState.view === key
                  ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {VIEW_LABELS[key]}
            </button>
          ))}
        </div>

        {/* ── Source filter (headlines tab) ────────────────── */}
        {routeState.view === "headlines" && (
          <div className="mb-6 flex flex-wrap gap-2">
            {SOURCE_OPTIONS.map((src) => (
              <button
                key={src}
                onClick={() => updateRouteState({ source: src })}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  routeState.source === src
                    ? "bg-[var(--color-primary)] text-white"
                    : "border border-[var(--border-primary)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {SOURCE_LABELS[src]}
              </button>
            ))}
          </div>
        )}

        {/* ── Feed errors banner ──────────────────────────── */}
        {feedErrors.length > 0 && !loading && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
            Some feeds unavailable: {feedErrors.join("; ")}
          </div>
        )}

        {/* ── Content ─────────────────────────────────────── */}
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <>
            {routeState.view === "headlines" && (
              <HeadlinesView articles={filtered} variants={variants} />
            )}
            {routeState.view === "coverage" && (
              <CoverageView articles={articles} variants={variants} />
            )}
            {routeState.view === "analysis" && (
              <AnalysisView articles={articles} variants={variants} />
            )}
          </>
        )}

        {/* ── Footer ──────────────────────────────────────── */}
        {fetchedAt && !loading && (
          <p className="mt-8 text-center text-xs text-[var(--text-tertiary)]">
            Last fetched: {new Date(fetchedAt).toLocaleString()}
            {" · "}
            {articles.length} articles from {Array.from(new Set(articles.map((a: NewsArticle) => a.source))).length} sources
          </p>
        )}
      </div>
    </section>
  );
}

// ── Loading / Error ─────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-10 h-10 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-[var(--text-tertiary)]">Fetching live feeds…</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-center">
      <p className="text-sm font-semibold text-red-600 dark:text-red-400">
        Failed to load feeds
      </p>
      <p className="mt-2 text-xs text-[var(--text-tertiary)]">{message}</p>
    </div>
  );
}

// ── Headlines View ──────────────────────────────────────────────────────────

function HeadlinesView({
  articles,
  variants,
}: {
  articles: NewsArticle[];
  variants: typeof fadeIn;
}) {
  if (articles.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-[var(--text-tertiary)]">
        No articles found for this source.
      </p>
    );
  }

  return (
    <motion.div
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      {articles.slice(0, 60).map((article, i) => (
        <a
          key={`${article.source}-${i}`}
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-5 shadow-[var(--shadow-sm)] transition hover:shadow-md hover:border-[color-mix(in_srgb,var(--color-primary)_30%,var(--border-primary))]"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <span
              className="inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: article.sourceColor }}
            >
              {article.sourceName}
            </span>
            <span className="shrink-0 text-[11px] text-[var(--text-tertiary)]">
              {timeAgo(article.pubDate)}
            </span>
          </div>
          <h3 className="text-[15px] font-semibold leading-snug text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition">
            {article.title}
          </h3>
          {article.description && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">
              {article.description}
            </p>
          )}
          {article.category && article.category !== "General" && (
            <span className="mt-3 self-start rounded-md bg-[var(--surface-secondary)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
              {article.category}
            </span>
          )}
        </a>
      ))}
    </motion.div>
  );
}

// ── Coverage View ───────────────────────────────────────────────────────────

function CoverageView({
  articles,
  variants,
}: {
  articles: NewsArticle[];
  variants: typeof fadeIn;
}) {
  const topics = useMemo(() => extractTopics(articles), [articles]);
  const sourceIds = useMemo(
    () => Array.from(new Set(articles.map((a: NewsArticle) => a.source))).sort(),
    [articles],
  );

  if (topics.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-[var(--text-tertiary)]">
        Not enough articles to extract topics.
      </p>
    );
  }

  return (
    <motion.div variants={variants} initial="hidden" animate="visible">
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        Topics appearing across 2+ outlets, ranked by total coverage depth.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] shadow-[var(--shadow-sm)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-primary)]">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Topic
              </th>
              {sourceIds.map((s: string) => (
                <th
                  key={s}
                  className="px-3 py-3 text-center"
                >
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)]"
                    title={`${SOURCE_META[s]?.name ?? s} topic count`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: SOURCE_META[s]?.color ?? "var(--color-primary)" }}
                      aria-hidden
                    />
                    {SOURCE_META[s]?.name ?? s}
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {topics.map((t: { topic: string; count: number; sources: Record<string, number> }) => (
              <tr
                key={t.topic}
                className="border-b border-[var(--border-primary)] last:border-b-0"
              >
                <td className="px-4 py-3 font-medium capitalize text-[var(--text-primary)]">
                  {t.topic}
                </td>
                {sourceIds.map((s: string) => {
                  const count = t.sources[s] ?? 0;
                  return (
                    <td key={s} className="px-3 py-3 text-center">
                      {count > 0 ? (
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{
                            backgroundColor: SOURCE_META[s]?.color ?? "var(--color-primary)",
                            opacity: Math.min(0.4 + count * 0.15, 1),
                          }}
                        >
                          {count}
                        </span>
                      ) : (
                        <span className="text-[var(--text-tertiary)]">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center font-semibold text-[var(--text-primary)]">
                  {t.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ── Analysis View ───────────────────────────────────────────────────────────

function AnalysisView({
  articles,
  variants,
}: {
  articles: NewsArticle[];
  variants: typeof fadeIn;
}) {
  const sourceIds = useMemo(
    () => Array.from(new Set(articles.map((a: NewsArticle) => a.source))).sort(),
    [articles],
  );

  const sentimentBySource = useMemo(() => {
    const map: Record<string, { positive: number; negative: number; neutral: number; total: number }> = {};
    for (const a of articles) {
      const s = analyzeSentiment(`${a.title} ${a.description}`);
      if (!map[a.source]) map[a.source] = { positive: 0, negative: 0, neutral: 0, total: 0 };
      map[a.source][s.label]++;
      map[a.source].total++;
    }
    return map;
  }, [articles]);

  const headlineLengthBySource = useMemo(() => {
    const map: Record<string, { totalLen: number; count: number }> = {};
    for (const a of articles) {
      if (!map[a.source]) map[a.source] = { totalLen: 0, count: 0 };
      map[a.source].totalLen += a.title.split(/\s+/).length;
      map[a.source].count++;
    }
    return map;
  }, [articles]);

  const readabilityBySource = useMemo(() => {
    const map: Record<string, { totalScore: number; count: number }> = {};
    for (const a of articles) {
      const r = calculateReadingLevel(a.title);
      if (!map[a.source]) map[a.source] = { totalScore: 0, count: 0 };
      map[a.source].totalScore += r.score;
      map[a.source].count++;
    }
    return map;
  }, [articles]);

  const maxAvgLen = Math.max(
    ...sourceIds.map((s: string) => {
      const d = headlineLengthBySource[s];
      return d ? d.totalLen / d.count : 0;
    }),
    1,
  );

  return (
    <motion.div
      className="grid gap-6 lg:grid-cols-2"
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-5 shadow-[var(--shadow-sm)] lg:col-span-2">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">How analysis works</h2>
        <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">
          Sentiment is estimated from headline + description keyword balance, headline length is average word count, and readability is a headline-level Flesch-style approximation. These are directional indicators for editorial framing, not full article-level NLP.
        </p>
      </div>

      {/* Sentiment distribution */}
      <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-6 shadow-[var(--shadow-sm)]">
        <h2 className="mb-1 text-base font-bold text-[var(--text-primary)]">Headline Sentiment</h2>
        <p className="mb-5 text-xs text-[var(--text-tertiary)]">
          Lexicon-based positive / neutral / negative distribution per outlet
        </p>
        <div className="space-y-4">
          {sourceIds.map((s: string) => {
            const d = sentimentBySource[s];
            if (!d) return null;
            const pPct = Math.round((d.positive / d.total) * 100);
            const nPct = Math.round((d.negative / d.total) * 100);
            const neuPct = 100 - pPct - nPct;
            return (
              <div key={s}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    {SOURCE_META[s]?.name ?? s}
                  </span>
                  <span className="text-[10px] text-[var(--text-tertiary)]">{d.total} articles</span>
                </div>
                <div className="flex h-5 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-emerald-500 transition-all"
                    style={{ width: `${pPct}%` }}
                    title={`Positive: ${pPct}%`}
                  />
                  <div
                    className="bg-slate-400 transition-all"
                    style={{ width: `${neuPct}%` }}
                    title={`Neutral: ${neuPct}%`}
                  />
                  <div
                    className="bg-rose-500 transition-all"
                    style={{ width: `${nPct}%` }}
                    title={`Negative: ${nPct}%`}
                  />
                </div>
                <div className="mt-1 flex gap-3 text-[10px] text-[var(--text-tertiary)]">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> {pPct}% pos
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-slate-400" /> {neuPct}% neu
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-rose-500" /> {nPct}% neg
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Headline length */}
      <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-6 shadow-[var(--shadow-sm)]">
        <h2 className="mb-1 text-base font-bold text-[var(--text-primary)]">Average Headline Length</h2>
        <p className="mb-5 text-xs text-[var(--text-tertiary)]">
          Words per headline by outlet
        </p>
        <div className="space-y-4">
          {sourceIds.map((s: string) => {
            const d = headlineLengthBySource[s];
            if (!d) return null;
            const avg = d.totalLen / d.count;
            const pct = (avg / maxAvgLen) * 100;
            return (
              <div key={s}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    {SOURCE_META[s]?.name ?? s}
                  </span>
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    {avg.toFixed(1)} words
                  </span>
                </div>
                <div className="h-4 w-full rounded-full bg-[var(--surface-secondary)]">
                  <div
                    className="h-4 rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: SOURCE_META[s]?.color ?? "var(--color-primary)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Readability */}
      <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-6 shadow-[var(--shadow-sm)] lg:col-span-2">
        <h2 className="mb-1 text-base font-bold text-[var(--text-primary)]">Readability Score</h2>
        <p className="mb-5 text-xs text-[var(--text-tertiary)]">
          Flesch Reading Ease approximation — higher is easier to read (0–100 scale)
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sourceIds.map((s: string) => {
            const d = readabilityBySource[s];
            if (!d) return null;
            const avg = Math.round(d.totalScore / d.count);
            const label = avg >= 70 ? "Easy" : avg >= 50 ? "Moderate" : "Advanced";
            const color = avg >= 70 ? "text-emerald-600" : avg >= 50 ? "text-amber-600" : "text-rose-600";
            return (
              <div
                key={s}
                className="flex items-center gap-4 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-3"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{ backgroundColor: SOURCE_META[s]?.color ?? "var(--color-primary)" }}
                >
                  {avg}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {SOURCE_META[s]?.name ?? s}
                  </p>
                  <p className={`text-xs font-medium ${color}`}>{label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
