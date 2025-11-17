"use client";

import Link from "next/link";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { WarmCard } from "@/components/ui/WarmCard";
import { Badge } from "@/components/ui/Badge";
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

export function SearchResults({
  query,
  results,
  isLoading,
  hasSearched,
  totalResults,
  searchTime
}: SearchResultsProps) {
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-electric-blue border-t-transparent"></div>
            <span className="text-slate-600 dark:text-slate-400">Searching...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!hasSearched) {
    return null;
  }

  if (hasSearched && results.length === 0) {
    return (
      <WarmCard hover={false} padding="md" className="text-center py-12">
        <div className="max-w-md mx-auto">
          <IconSearch className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <Heading level={3} className="mb-2">
            No results found
          </Heading>
          <Paragraph className="text-slate-600 dark:text-slate-400 mb-6">
            {query ? (
              <>No results found for "<strong>{query}</strong>". Try different keywords or remove filters.</>
            ) : (
              "Please enter a search query to find content."
            )}
          </Paragraph>
          <div className="space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Suggestions:</p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>• Try broader or different keywords</li>
              <li>• Check spelling and try again</li>
              <li>• Remove filters to expand results</li>
              <li>• Browse categories directly</li>
            </ul>
          </div>
        </div>
      </WarmCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level={2} className="text-xl">
            Search Results
          </Heading>
          <Paragraph className="text-slate-600 dark:text-slate-400">
            {totalResults.toLocaleString()} result{totalResults !== 1 ? 's' : ''} found
            {query && (
              <> for "<span className="font-medium text-slate-900 dark:text-slate-100">{query}</span>"</>
            )}
            <span className="ml-2 text-sm">
              ({searchTime}ms)
            </span>
          </Paragraph>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {results.map((result) => (
          <SearchResultCard key={result.id} result={result} query={query} />
        ))}
      </div>

      {/* Load More (if needed) */}
      {results.length < totalResults && (
        <div className="text-center">
          <button className="text-electric-blue hover:underline text-sm">
            Load more results
          </button>
        </div>
      )}
    </div>
  );
}

interface SearchResultCardProps {
  result: SearchResult;
  query: string;
}

function SearchResultCard({ result, query }: SearchResultCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blog':
        return <IconFileText className="w-4 h-4" />;
      case 'project':
        return <IconBriefcase className="w-4 h-4" />;
      default:
        return <IconHome className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string): "electric" | "matrix" | "outline" => {
    switch (type) {
      case 'blog':
        return 'electric';
      case 'project':
        return 'matrix';
      default:
        return 'outline';
    }
  };

  const highlightQuery = (text: string, query: string): string => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>');
  };

  return (
    <WarmCard hover={false} padding="md" className="p-6 hover:translate-x-1 transition-transform duration-200">
      <Link href={result.url} className="block">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={getTypeColor(result.type)} size="sm">
                  <span className="flex items-center gap-1">
                    {getTypeIcon(result.type)}
                    {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                  </span>
                </Badge>
                {result.category && (
                  <Badge variant="outline" size="sm">
                    {result.category}
                  </Badge>
                )}
              </div>
              
              <Heading 
                level={3} 
                className="text-lg text-electric-blue hover:text-matrix-green transition-colors line-clamp-2"
              >
                <span 
                  dangerouslySetInnerHTML={{ 
                    __html: highlightQuery(result.title, query) 
                  }} 
                />
              </Heading>
            </div>
            
            <div className="text-right text-sm text-slate-500 dark:text-slate-400 flex-shrink-0">
              {result.publishedAt && (
                <div className="flex items-center gap-1">
                  <IconClock className="w-3 h-3" />
                  {new Date(result.publishedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Excerpt */}
          <Paragraph 
            className="text-slate-600 dark:text-slate-400 line-clamp-3"
          >
            <span 
              dangerouslySetInnerHTML={{ 
                __html: highlightQuery(result.excerpt, query) 
              }} 
            />
          </Paragraph>

          {/* Tags */}
          {result.tags && result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {result.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="ghost" size="sm">
                  {tag}
                </Badge>
              ))}
              {result.tags.length > 4 && (
                <Badge variant="ghost" size="sm">
                  +{result.tags.length - 4} more
                </Badge>
              )}
            </div>
          )}

          {/* URL Preview */}
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
            isaacavazquez.com{result.url}
          </div>
        </div>
      </Link>
    </WarmCard>
  );
}