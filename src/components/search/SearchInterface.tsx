"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { SearchResults } from "./SearchResults";
import { SearchFilters } from "./SearchFilters";
import { IconSearch, IconX, IconFilter } from "@tabler/icons-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useTrackedListingSearch } from "@/hooks/useTrackedListingSearch";
import { trackListingFilter } from "@/lib/analytics";
import { logger } from "@/lib/logger";

export interface SearchInterfaceProps {
  initialQuery?: string;
  initialType?: string;
  initialCategory?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  type: 'post' | 'project' | 'page';
  category?: string;
  tags?: string[];
  publishedAt?: string;
}

interface SearchApiResponse {
  results?: SearchResult[];
  total?: number;
}

export interface SearchState {
  query: string;
  type: string;
  category: string;
  results: SearchResult[];
  isLoading: boolean;
  hasSearched: boolean;
  totalResults: number;
  searchTime: number;
}

function getSearchStateKey(query: string, type: string, category: string) {
  return JSON.stringify([query, type, category]);
}

function readSeededSearchState(fallbacks: Pick<SearchState, "query" | "type" | "category">) {
  if (typeof window === "undefined") {
    return fallbacks;
  }

  const params = new URLSearchParams(window.location.search);

  return {
    query: params.get("q") ?? fallbacks.query,
    type: params.get("type") ?? fallbacks.type,
    category: params.get("category") ?? fallbacks.category,
  };
}

const sectionTitleStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink)",
  fontWeight: 600,
  letterSpacing: "-0.02em",
};

const bodyStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink-muted)",
};

export function SearchInterface({
  initialQuery = "",
  initialType = "all",
  initialCategory = "all"
}: SearchInterfaceProps) {
  const router = useRouter();
  const pendingUrlSyncKeyRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const seededState = readSeededSearchState({
    query: initialQuery,
    type: initialType,
    category: initialCategory,
  });

  const [searchState, setSearchState] = useState<SearchState>(() => ({
    query: seededState.query,
    type: seededState.type,
    category: seededState.category,
    results: [],
    isLoading: false,
    hasSearched: false,
    totalResults: 0,
    searchTime: 0
  }));

  const [showFilters, setShowFilters] = useState(false);
  const debouncedQuery = useDebounce(searchState.query, 300);
  const effectiveQuery = searchState.query === "" ? "" : debouncedQuery;

  // Report completed searches to GA4 (no-op unless analytics is enabled).
  useTrackedListingSearch("site_search", searchState.query, searchState.totalResults);

  useEffect(() => {
    const nextSeededState = readSeededSearchState({
      query: initialQuery,
      type: initialType,
      category: initialCategory,
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync local search state when URL-derived seeded state changes; identity check prevents redundant updates
    setSearchState((prev) => {
      if (
        prev.query === nextSeededState.query &&
        prev.type === nextSeededState.type &&
        prev.category === nextSeededState.category
      ) {
        return prev;
      }

      return {
        ...prev,
        query: nextSeededState.query,
        type: nextSeededState.type,
        category: nextSeededState.category,
      };
    });
  }, [initialCategory, initialQuery, initialType]);

  // Update URL when search parameters change
  const updateURL = useCallback((query: string, type: string, category: string) => {
    pendingUrlSyncKeyRef.current = getSearchStateKey(query, type, category);
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query);
    if (type !== 'all') params.set('type', type);
    if (category !== 'all') params.set('category', category);

    const queryString = params.toString();
    const newUrl = queryString ? `/search?${queryString}` : '/search';

    router.push(newUrl, { scroll: false });
  }, [router]);

  // Perform search
  const performSearch = useCallback(async (query: string, type: string, category: string) => {
    if (!query.trim()) {
      setSearchState(prev => ({
        ...prev,
        results: [],
        hasSearched: false,
        totalResults: 0,
        searchTime: 0
      }));
      return;
    }

    setSearchState(prev => ({ ...prev, isLoading: true }));

    const startTime = Date.now();

    try {
      const response = await fetch(`/api/search?${new URLSearchParams({
        q: query,
        ...(type !== 'all' && { type }),
        ...(category !== 'all' && { category })
      })}`);

      const data: SearchApiResponse = await response.json();
      const searchTime = Date.now() - startTime;

      setSearchState(prev => ({
        ...prev,
        results: data.results || [],
        isLoading: false,
        hasSearched: true,
        totalResults: data.total || 0,
        searchTime
      }));
    } catch (error) {
      logger.error('Search failed', error);
      setSearchState(prev => ({
        ...prev,
        results: [],
        isLoading: false,
        hasSearched: true,
        totalResults: 0,
        searchTime: Date.now() - startTime
      }));
    }
  }, []);

  // Effect for debounced search
  useEffect(() => {
    if (
      effectiveQuery !== initialQuery ||
      searchState.type !== initialType ||
      searchState.category !== initialCategory
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Run a debounced search and URL sync when filters change; performSearch internally updates loading/results state
      performSearch(effectiveQuery, searchState.type, searchState.category);
      updateURL(effectiveQuery, searchState.type, searchState.category);
    }
  }, [
    effectiveQuery,
    searchState.type,
    searchState.category,
    performSearch,
    updateURL,
    initialQuery,
    initialType,
    initialCategory,
  ]);

  // Initial search if query is provided
  useEffect(() => {
    const nextSearchKey = getSearchStateKey(initialQuery, initialType, initialCategory);

    if (pendingUrlSyncKeyRef.current === nextSearchKey) {
      pendingUrlSyncKeyRef.current = null;
      return;
    }

    if (initialQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial search when URL provides a query; performSearch updates results/loading state
      performSearch(initialQuery, initialType, initialCategory);
      return;
    }

    setSearchState((prev) => ({
      ...prev,
      results: [],
      isLoading: false,
      hasSearched: false,
      totalResults: 0,
      searchTime: 0,
    }));
  }, [performSearch, initialCategory, initialQuery, initialType]);

  const handleQueryChange = (query: string) => {
    setSearchState(prev => ({ ...prev, query }));
  };

  const handleTypeChange = (type: string) => {
    trackListingFilter({ listing_id: "site_search", filter_type: "content_type", filter_value: type });
    setSearchState(prev => ({ ...prev, type }));
  };

  const handleCategoryChange = (category: string) => {
    trackListingFilter({ listing_id: "site_search", filter_type: "category", filter_value: category });
    setSearchState(prev => ({ ...prev, category }));
  };

  const clearSearch = () => {
    setSearchState(prev => ({
      ...prev,
      query: "",
      type: "all",
      category: "all",
      results: [],
      hasSearched: false,
      totalResults: 0,
      searchTime: 0
    }));
    updateURL("", "all", "all");
    // The clear (X) button unmounts the moment the query is empty; move focus
    // back to the input so keyboard/screen-reader users aren't dropped to <body>.
    inputRef.current?.focus();
  };

  const clearFilters = () => {
    setSearchState(prev => ({
      ...prev,
      type: "all",
      category: "all"
    }));
  };

  const filterActive = showFilters || searchState.type !== "all" || searchState.category !== "all";

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <article className="home-card p-6 sm:p-7 space-y-4">
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <IconSearch
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: "var(--home-ink-muted)" }}
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                type="text"
                value={searchState.query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search writing, projects, and tools…"
                aria-label="Search content"
                aria-controls="search-results"
                className="w-full min-h-[44px] pl-12 pr-12 py-3 rounded-xl transition-colors"
                style={{
                  fontFamily: "var(--font-home-sans)",
                  background: "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
                  border: "1px solid var(--home-rule)",
                  color: "var(--home-ink)",
                }}
              />
              {searchState.query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md transition-colors"
                  style={{ color: "var(--home-ink-muted)" }}
                >
                  <IconX className="w-5 h-5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              aria-label={showFilters ? "Hide filters" : "Show filters"}
              aria-expanded={showFilters}
              aria-controls="search-filters"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-3 transition-colors"
              style={
                filterActive
                  ? {
                      background: "var(--home-ink)",
                      color: "var(--home-paper)",
                      border: "1px solid var(--home-ink)",
                    }
                  : {
                      background: "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
                      color: "var(--home-ink-muted)",
                      border: "1px solid var(--home-rule)",
                    }
              }
            >
              <IconFilter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div id="search-filters">
            <SearchFilters
              type={searchState.type}
              category={searchState.category}
              onTypeChange={handleTypeChange}
              onCategoryChange={handleCategoryChange}
              onClearFilters={clearFilters}
            />
          </div>
        )}

        {/* Active Filters Display */}
        {(searchState.type !== 'all' || searchState.category !== 'all') && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm" style={bodyStyle}>
              Active filters:
            </span>
            {searchState.type !== 'all' && (
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  fontFamily: "var(--font-home-sans)",
                  background: "var(--home-ink)",
                  color: "var(--home-paper)",
                  letterSpacing: "0.02em",
                }}
              >
                Type: {searchState.type}
              </span>
            )}
            {searchState.category !== 'all' && (
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  fontFamily: "var(--font-home-sans)",
                  background: "var(--home-ink)",
                  color: "var(--home-paper)",
                  letterSpacing: "0.02em",
                }}
              >
                Category: {searchState.category}
              </span>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm underline underline-offset-2"
              style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-haze)" }}
            >
              Clear filters
            </button>
          </div>
        )}
      </article>

      {/* Politely announce loading / result-count / empty states to assistive tech. */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {searchState.isLoading
          ? "Searching…"
          : searchState.hasSearched
            ? searchState.totalResults === 0
              ? `No results found${searchState.query ? ` for ${searchState.query}` : ""}`
              : `${searchState.totalResults} result${searchState.totalResults === 1 ? "" : "s"} found`
            : ""}
      </div>

      {/* Search Results */}
      <div id="search-results">
        <SearchResults
          query={searchState.query}
          results={searchState.results}
          isLoading={searchState.isLoading}
          hasSearched={searchState.hasSearched}
          totalResults={searchState.totalResults}
          searchTime={searchState.searchTime}
        />
      </div>

      {/* Search Tips */}
      {!searchState.hasSearched && !searchState.query && (
        <article className="home-card p-6 sm:p-8 space-y-5">
          <h2 className="text-xl mb-0" style={sectionTitleStyle}>
            Search tips
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <p className="mb-0 text-sm" style={{ ...sectionTitleStyle, fontSize: "0.95rem" }}>
                What you can search for
              </p>
              <ul className="mb-0 space-y-1 text-sm leading-6" style={bodyStyle}>
                <li>• Writing on product strategy and analytics</li>
                <li>• Case studies and project details</li>
                <li>• Fantasy football rankings and analysis</li>
                <li>• Investment and fintech tools</li>
                <li>• Sports dashboards</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="mb-0 text-sm" style={{ ...sectionTitleStyle, fontSize: "0.95rem" }}>
                Search examples
              </p>
              <div className="space-y-1.5">
                {["product strategy", "fantasy football", "investment research"].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => handleQueryChange(example)}
                    className="block text-left text-sm underline underline-offset-2"
                    style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-haze)" }}
                  >
                    &ldquo;{example}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>
        </article>
      )}
    </div>
  );
}
