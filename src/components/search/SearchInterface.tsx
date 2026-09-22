"use client";

import { Funnel, Search, X } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { SearchResults } from "./SearchResults";
import { SearchFilters } from "./SearchFilters";
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
    <div style={{ display: "grid", gap: "var(--c97-sp-4)" }}>
      {/* Search Bar */}
      <div style={{ display: "grid", gap: "var(--c97-sp-2)" }}>
        <label className="c97-kicker" htmlFor="site-search-input">
          Search content
        </label>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "var(--c97-sp-2)",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: "1 1 16rem",
              minWidth: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search
              className="h-5 w-5"
              style={{
                position: "absolute",
                left: "var(--c97-sp-2)",
                color: "var(--c97-label)",
                pointerEvents: "none",
              }}
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              id="site-search-input"
              type="text"
              value={searchState.query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search writing, projects, and tools…"
              aria-label="Search content"
              aria-controls="search-results"
              className="c97-field"
              style={{
                paddingLeft: "calc(var(--c97-sp-2) * 2 + 1.25rem)",
                paddingRight: searchState.query ? "calc(var(--c97-sp-2) + 48px)" : undefined,
              }}
            />
            {searchState.query && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="c97-btn-ghost"
                style={{
                  position: "absolute",
                  right: 0,
                  minWidth: 48,
                  justifyContent: "center",
                  textDecoration: "none",
                }}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            aria-label={showFilters ? "Hide filters" : "Show filters"}
            aria-expanded={showFilters}
            aria-controls="search-filters"
            className="c97-btn-ghost"
            style={{
              gap: "var(--c97-sp-1)",
              color: filterActive ? "var(--c97-ink)" : undefined,
            }}
          >
            <Funnel className="h-4 w-4" aria-hidden="true" />
            {showFilters ? "Hide filters" : "Show filters"}
          </button>
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
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "var(--c97-sp-1)",
            }}
          >
            <span className="c97-kicker">Active filters:</span>
            {searchState.type !== 'all' && (
              <span className="c97-chip">Type: {searchState.type}</span>
            )}
            {searchState.category !== 'all' && (
              <span className="c97-chip">Category: {searchState.category}</span>
            )}
            <button type="button" onClick={clearFilters} className="c97-btn-ghost">
              Clear filters
            </button>
          </div>
        )}
      </div>

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
        <div className="c97-panel">
          <p className="c97-kicker">Search tips</p>
          <div className="c97-columns" style={{ marginTop: "var(--c97-sp-3)" }}>
            <div>
              <h2 className="c97-serif c97-h3">What you can search for</h2>
              <ul className="c97-list" style={{ marginTop: "var(--c97-sp-2)" }}>
                <li>Writing on product strategy and analytics</li>
                <li>Case studies and project details</li>
                <li>Fantasy football rankings and analysis</li>
                <li>Investment and fintech tools</li>
                <li>Sports dashboards</li>
              </ul>
            </div>
            <div>
              <h2 className="c97-serif c97-h3">Search examples</h2>
              <ul
                className="c97-list"
                style={{ marginTop: "var(--c97-sp-2)", listStyle: "none", paddingLeft: 0 }}
              >
                {["product strategy", "fantasy football", "investment research"].map((example) => (
                  <li key={example}>
                    <button
                      type="button"
                      onClick={() => handleQueryChange(example)}
                      className="c97-btn-ghost"
                      style={{ textTransform: "none", letterSpacing: 0, paddingLeft: 0 }}
                    >
                      &ldquo;{example}&rdquo;
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
