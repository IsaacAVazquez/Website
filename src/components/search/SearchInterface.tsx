"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { MorphButton } from "@/components/ui/MorphButton";
import { SearchResults } from "./SearchResults";
import { SearchFilters } from "./SearchFilters";
import { IconSearch, IconX, IconFilter } from "@tabler/icons-react";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchInterfaceProps {
  initialQuery?: string;
  initialType?: string;
  initialCategory?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  type: 'blog' | 'project' | 'page';
  category?: string;
  tags?: string[];
  publishedAt?: string;
  relevanceScore: number;
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

export function SearchInterface({ 
  initialQuery = "", 
  initialType = "all",
  initialCategory = "all"
}: SearchInterfaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchState, setSearchState] = useState<SearchState>({
    query: initialQuery,
    type: initialType,
    category: initialCategory,
    results: [],
    isLoading: false,
    hasSearched: false,
    totalResults: 0,
    searchTime: 0
  });

  const [showFilters, setShowFilters] = useState(false);
  const debouncedQuery = useDebounce(searchState.query, 300);

  // Update URL when search parameters change
  const updateURL = useCallback((query: string, type: string, category: string) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
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
      
      const data = await response.json();
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
      console.error('Search failed:', error);
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
    if (debouncedQuery !== initialQuery || searchState.type !== initialType || searchState.category !== initialCategory) {
      performSearch(debouncedQuery, searchState.type, searchState.category);
      updateURL(debouncedQuery, searchState.type, searchState.category);
    }
  }, [debouncedQuery, searchState.type, searchState.category, performSearch, updateURL, initialQuery, initialType, initialCategory]);

  // Initial search if query is provided
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, initialType, initialCategory);
    }
  }, []);

  const handleQueryChange = (query: string) => {
    setSearchState(prev => ({ ...prev, query }));
  };

  const handleTypeChange = (type: string) => {
    setSearchState(prev => ({ ...prev, type }));
  };

  const handleCategoryChange = (category: string) => {
    setSearchState(prev => ({ ...prev, category }));
  };

  const clearSearch = () => {
    setSearchState(prev => ({
      ...prev,
      query: "",
      results: [],
      hasSearched: false,
      totalResults: 0,
      searchTime: 0
    }));
    updateURL("", "all", "all");
  };

  const clearFilters = () => {
    setSearchState(prev => ({
      ...prev,
      type: "all",
      category: "all"
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <Heading level={1} className="mb-4">
          Search{" "}
          <span className="bg-gradient-to-r from-electric-blue via-matrix-green to-cyber-teal bg-clip-text text-transparent">
            Everything
          </span>
        </Heading>
        <Paragraph size="lg" className="max-w-2xl mx-auto text-slate-600 dark:text-slate-400">
          Find blog posts, projects, and insights across QA engineering, fantasy football analytics, and software development.
        </Paragraph>
      </div>

      {/* Search Bar */}
      <GlassCard className="p-6">
        <div className="space-y-4">
          {/* Main Search Input */}
          <div className="relative">
            <div className="flex items-center">
              <div className="relative flex-1">
                <IconSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchState.query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Search for content..."
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-electric-blue focus:border-transparent transition-all duration-200 text-slate-900 dark:text-slate-100"
                />
                {searchState.query && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <IconX className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`ml-4 p-4 rounded-lg border transition-all duration-200 ${
                  showFilters || searchState.type !== 'all' || searchState.category !== 'all'
                    ? 'bg-electric-blue text-white border-electric-blue' 
                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <IconFilter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <SearchFilters
              type={searchState.type}
              category={searchState.category}
              onTypeChange={handleTypeChange}
              onCategoryChange={handleCategoryChange}
              onClearFilters={clearFilters}
            />
          )}

          {/* Active Filters Display */}
          {(searchState.type !== 'all' || searchState.category !== 'all') && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-600 dark:text-slate-400">Active filters:</span>
              {searchState.type !== 'all' && (
                <Badge variant="electric" size="sm">
                  Type: {searchState.type}
                </Badge>
              )}
              {searchState.category !== 'all' && (
                <Badge variant="matrix" size="sm">
                  Category: {searchState.category}
                </Badge>
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-electric-blue hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Search Results */}
      <SearchResults
        query={searchState.query}
        results={searchState.results}
        isLoading={searchState.isLoading}
        hasSearched={searchState.hasSearched}
        totalResults={searchState.totalResults}
        searchTime={searchState.searchTime}
      />

      {/* Search Tips */}
      {!searchState.hasSearched && !searchState.query && (
        <GlassCard className="p-6">
          <Heading level={3} className="mb-4">
            Search Tips
          </Heading>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                What you can search for:
              </h4>
              <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>• Blog posts and technical articles</li>
                <li>• Project documentation</li>
                <li>• QA engineering resources</li>
                <li>• Fantasy football analytics</li>
                <li>• Software development guides</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Search examples:
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => handleQueryChange("automated testing")}
                  className="block text-sm text-electric-blue hover:underline text-left"
                >
                  "automated testing"
                </button>
                <button
                  onClick={() => handleQueryChange("fantasy football analytics")}
                  className="block text-sm text-electric-blue hover:underline text-left"
                >
                  "fantasy football analytics"
                </button>
                <button
                  onClick={() => handleQueryChange("software quality")}
                  className="block text-sm text-electric-blue hover:underline text-left"
                >
                  "software quality"
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}