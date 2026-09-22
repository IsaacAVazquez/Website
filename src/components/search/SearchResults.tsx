"use client";

import { Briefcase, Clock, FileText, House, Search } from "lucide-react";
import Link from "next/link";
import type { SearchResult } from "./SearchInterface";

interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  hasSearched: boolean;
  totalResults: number;
  searchTime: number;
}

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
      <div className="c97-panel" style={{ display: "grid", gap: "var(--c97-sp-2)" }}>
        <p className="c97-kicker">Searching…</p>
        <span
          className="c97-skeleton"
          style={{ height: "var(--c97-fs-h3)", width: "min(100%, 24rem)" }}
          aria-hidden="true"
        />
        <span
          className="c97-skeleton"
          style={{ height: "var(--c97-fs-body)", width: "min(100%, 36rem)" }}
          aria-hidden="true"
        />
      </div>
    );
  }

  if (!hasSearched) {
    return null;
  }

  if (hasSearched && results.length === 0) {
    return (
      <div className="c97-panel" style={{ display: "grid", gap: "var(--c97-sp-2)" }}>
        <Search
          className="h-5 w-5"
          style={{ color: "var(--c97-label)" }}
          aria-hidden="true"
        />
        <h2 className="c97-serif c97-h2">No results found</h2>
        <p className="c97-prose" style={{ color: "var(--c97-ink-2)" }}>
          {query ? (
            <>
              No results for &ldquo;<strong style={{ color: "var(--c97-ink)", fontWeight: 600 }}>{query}</strong>&rdquo;. Try different keywords or remove filters.
            </>
          ) : (
            "Please enter a search query to find content."
          )}
        </p>
        <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-2)" }}>
          Suggestions
        </p>
        <ul className="c97-list">
          <li>Try broader or different keywords</li>
          <li>Check spelling and try again</li>
          <li>Remove filters to expand results</li>
          <li>Browse categories directly</li>
        </ul>
      </div>
    );
  }

  return (
    <div>
      <p className="c97-kicker">Results</p>
      <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-2)" }}>
        {results.length < totalResults
          ? `Showing ${results.length.toLocaleString()} of ${totalResults.toLocaleString()} results`
          : `${totalResults.toLocaleString()} result${totalResults !== 1 ? 's' : ''} found`}
        {query ? (
          <>
            {' '}for &ldquo;{query}&rdquo;
          </>
        ) : null}
      </h2>
      <p className="c97-meta" style={{ marginTop: "var(--c97-sp-1)" }}>
        <span className="c97-tabular">Returned in {searchTime}ms</span>
      </p>

      <div style={{ marginTop: "var(--c97-sp-3)" }}>
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
        return <FileText className="h-4 w-4" aria-hidden="true" />;
      case 'project':
        return <Briefcase className="h-4 w-4" aria-hidden="true" />;
      case 'page':
      default:
        return <House className="h-4 w-4" aria-hidden="true" />;
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
      '<mark style="background-color: var(--c97-field); color: var(--c97-ink); padding: 0 2px;">$1</mark>'
    );
  };

  const visibleTags = result.tags?.slice(0, 4) ?? [];
  const extraTagCount = (result.tags?.length ?? 0) - visibleTags.length;

  return (
    <article
      className="c97-row c97-row-stack-sm"
      style={{
        borderTop: "1px solid var(--c97-rule)",
        paddingBlock: "var(--c97-sp-3)",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h3 className="c97-serif c97-h3">
          <Link
            href={result.url}
            className="c97-link"
            style={{ display: "inline-block", minHeight: 44, textDecorationColor: "var(--c97-rule)" }}
          >
            <span
              dangerouslySetInnerHTML={{
                __html: highlightQuery(result.title, query),
              }}
            />
          </Link>
        </h3>
        <p
          className="c97-prose line-clamp-3"
          style={{ marginTop: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}
        >
          <span
            dangerouslySetInnerHTML={{
              __html: highlightQuery(result.excerpt, query),
            }}
          />
        </p>
        {visibleTags.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--c97-sp-1)",
              marginTop: "var(--c97-sp-2)",
            }}
          >
            {visibleTags.map((tag) => (
              <span key={tag} className="c97-chip">
                {tag}
              </span>
            ))}
            {extraTagCount > 0 && (
              <span className="c97-chip">+{extraTagCount} more</span>
            )}
          </div>
        )}
        <p
          className="c97-mono"
          style={{
            marginTop: "var(--c97-sp-2)",
            fontSize: "var(--c97-fs-label)",
            color: "var(--c97-label)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          isaacvazquez.com{result.url}
        </p>
      </div>

      <p className="c97-meta">
        <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--c97-sp-1)" }}>
          {getTypeIcon(result.type)}
          {TYPE_LABELS[result.type]}
        </span>
        {result.category && <span>{result.category}</span>}
        {result.publishedAt && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--c97-sp-1)" }}>
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span className="c97-tabular">
              {new Date(result.publishedAt).toLocaleDateString()}
            </span>
          </span>
        )}
      </p>
    </article>
  );
}
