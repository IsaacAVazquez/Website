"use client";

import Link from "next/link";
import { IconClock, IconSearch, IconFileText, IconBriefcase, IconHome } from "@tabler/icons-react";
import type { SearchResult } from "./SearchInterface";

interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  hasSearched: boolean;
  totalResults: number;
  searchTime: number;
}

const sectionTitleStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink)",
  fontWeight: 600,
  letterSpacing: "-0.02em",
} as const;

const bodyStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink-muted)",
} as const;

const strongBodyStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink)",
  fontWeight: 600,
} as const;

const tagPillStyle = {
  fontFamily: "var(--font-home-sans)",
  background: "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
  color: "var(--home-ink)",
  border: "1px solid var(--home-rule)",
  letterSpacing: "0.02em",
} as const;

export function SearchResults({
  query,
  results,
  isLoading,
  hasSearched,
  totalResults,
  searchTime,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <article className="home-card p-6 sm:p-8">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <div
              className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: "var(--home-ink)", borderTopColor: "transparent" }}
              aria-hidden="true"
            />
            <span className="text-sm" style={bodyStyle}>
              Searching…
            </span>
          </div>
        </div>
      </article>
    );
  }

  if (!hasSearched) {
    return null;
  }

  if (hasSearched && results.length === 0) {
    return (
      <article className="home-card p-6 sm:p-10 text-center">
        <div className="mx-auto max-w-md space-y-4">
          <IconSearch
            className="mx-auto h-12 w-12"
            style={{ color: "var(--home-ink-muted)" }}
            aria-hidden="true"
          />
          <h2 className="text-xl mb-0" style={sectionTitleStyle}>
            No results found
          </h2>
          <p className="mb-0 text-base leading-7" style={bodyStyle}>
            {query ? (
              <>
                No results for &ldquo;<strong style={strongBodyStyle}>{query}</strong>&rdquo;. Try different keywords or remove filters.
              </>
            ) : (
              "Please enter a search query to find content."
            )}
          </p>
          <div className="space-y-2 pt-2 text-left">
            <p className="mb-0 text-sm" style={{ ...sectionTitleStyle, fontSize: "0.88rem" }}>
              Suggestions
            </p>
            <ul className="mb-0 space-y-1 text-sm leading-6" style={bodyStyle}>
              <li>• Try broader or different keywords</li>
              <li>• Check spelling and try again</li>
              <li>• Remove filters to expand results</li>
              <li>• Browse categories directly</li>
            </ul>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="home-kicker mb-0">Results</p>
        <h2 className="text-2xl mb-0" style={sectionTitleStyle}>
          {results.length < totalResults
            ? `Showing ${results.length.toLocaleString()} of ${totalResults.toLocaleString()} results`
            : `${totalResults.toLocaleString()} result${totalResults !== 1 ? 's' : ''} found`}
          {query ? (
            <>
              {' '}for &ldquo;<span style={{ color: "var(--home-ink)" }}>{query}</span>&rdquo;
            </>
          ) : null}
        </h2>
        <p className="mb-0 text-sm" style={bodyStyle}>
          Returned in {searchTime}ms
        </p>
      </div>

      <div className="space-y-4">
        {results.map((result) => (
          <SearchResultCard key={result.id} result={result} query={query} />
        ))}
      </div>
    </div>
  );
}

interface SearchResultCardProps {
  result: SearchResult;
  query: string;
}

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  post: "Writing",
  project: "Project",
  page: "Page",
};

function SearchResultCard({ result, query }: SearchResultCardProps) {
  const getTypeIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case 'post':
        return <IconFileText className="w-3.5 h-3.5" aria-hidden="true" />;
      case 'project':
        return <IconBriefcase className="w-3.5 h-3.5" aria-hidden="true" />;
      case 'page':
      default:
        return <IconHome className="w-3.5 h-3.5" aria-hidden="true" />;
    }
  };

  const escapeHtml = (input: string): string =>
    input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const highlightQuery = (text: string, q: string): string => {
    const safe = escapeHtml(text);
    if (!q) return safe;
    // Highlight per word, mirroring the API matcher (which scores each
    // whitespace-separated word independently). A single contiguous-phrase
    // regex left word-matched results — e.g. "fantasy football" against
    // "Football rankings and fantasy tiers" — with no highlight at all.
    const words = q
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => escapeHtml(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (words.length === 0) return safe;
    const regex = new RegExp(`(${words.join('|')})`, 'gi');
    return safe.replace(
      regex,
      '<mark style="background-color: color-mix(in srgb, var(--home-signal) 40%, transparent); color: var(--home-ink); padding: 0 2px; border-radius: 2px;">$1</mark>'
    );
  };

  const typePillStyle = {
    fontFamily: "var(--font-home-sans)",
    background: "var(--home-ink)",
    color: "var(--home-paper)",
    letterSpacing: "0.02em",
  } as const;

  return (
    <article className="home-card p-6 transition-transform duration-200 hover:translate-x-1">
      <Link href={result.url} className="block space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                style={typePillStyle}
              >
                {getTypeIcon(result.type)}
                {TYPE_LABELS[result.type]}
              </span>
              {result.category && (
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                  style={tagPillStyle}
                >
                  {result.category}
                </span>
              )}
            </div>

            <h3
              className="text-lg mb-0 line-clamp-2"
              style={sectionTitleStyle}
            >
              <span
                dangerouslySetInnerHTML={{
                  __html: highlightQuery(result.title, query),
                }}
              />
            </h3>
          </div>

          {result.publishedAt && (
            <div
              className="flex items-center gap-1 text-xs flex-shrink-0"
              style={bodyStyle}
            >
              <IconClock className="w-3 h-3" aria-hidden="true" />
              {new Date(result.publishedAt).toLocaleDateString()}
            </div>
          )}
        </div>

        <p className="mb-0 text-sm leading-6 line-clamp-3" style={bodyStyle}>
          <span
            dangerouslySetInnerHTML={{
              __html: highlightQuery(result.excerpt, query),
            }}
          />
        </p>

        {result.tags && result.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {result.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-2xs font-semibold"
                style={tagPillStyle}
              >
                {tag}
              </span>
            ))}
            {result.tags.length > 4 && (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-2xs font-semibold"
                style={tagPillStyle}
              >
                +{result.tags.length - 4} more
              </span>
            )}
          </div>
        )}

        <div
          className="text-xs truncate"
          style={{ ...bodyStyle, opacity: 0.75 }}
        >
          isaacavazquez.com{result.url}
        </div>
      </Link>
    </article>
  );
}
