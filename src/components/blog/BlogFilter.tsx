"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { MorphButton } from "@/components/ui/MorphButton";
import { Heading } from "@/components/ui/Heading";
import { IconSearch, IconX } from "@tabler/icons-react";

interface BlogFilterProps {
  categories: string[];
  tags: string[];
  currentCategory?: string;
  currentTag?: string;
  currentQuery?: string;
}

export function BlogFilter({ 
  categories, 
  tags, 
  currentCategory, 
  currentTag, 
  currentQuery 
}: BlogFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(currentQuery || "");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    setSearchQuery(currentQuery || "");
  }, [currentQuery]);

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    // Clear search when selecting category/tag filters
    if (key !== 'q') {
      params.delete('q');
      setSearchQuery("");
    }
    
    // Clear category/tag when searching
    if (key === 'q') {
      params.delete('category');
      params.delete('tag');
    }
    
    const queryString = params.toString();
    const url = queryString ? `/blog?${queryString}` : '/blog';
    router.push(url);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      updateFilter('q', searchQuery.trim());
    } else {
      updateFilter('q', null);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    updateFilter('q', null);
  };

  return (
    <div className="mb-12 space-y-6">
      {/* Search Bar */}
      <GlassCard className="p-6">
        <form onSubmit={handleSearch} className="relative">
          <div className={`relative transition-all duration-300 ${
            isSearchFocused ? 'scale-[1.02]' : ''
          }`}>
            <IconSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search articles..."
              className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-electric-blue focus:border-transparent transition-all duration-200 text-slate-900 dark:text-slate-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <IconX className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="mt-4 flex justify-center">
            <MorphButton type="submit" variant="primary" size="sm">
              Search Articles
            </MorphButton>
          </div>
        </form>
      </GlassCard>

      {/* Category and Tag Filters */}
      <GlassCard className="p-6">
        <div className="space-y-6">
          {/* Categories */}
          <div>
            <Heading level={3} className="mb-4 text-lg">
              Categories
            </Heading>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={!currentCategory ? "electric" : "outline"}
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => updateFilter('category', null)}
              >
                All Categories
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={currentCategory === category ? "matrix" : "outline"}
                  className="cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => updateFilter('category', category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <Heading level={3} className="mb-4 text-lg">
                Tags
              </Heading>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={!currentTag ? "electric" : "outline"}
                  size="sm"
                  className="cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => updateFilter('tag', null)}
                >
                  All Tags
                </Badge>
                {tags.slice(0, 10).map((tag) => (
                  <Badge
                    key={tag}
                    variant={currentTag === tag ? "matrix" : "outline"}
                    size="sm"
                    className="cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => updateFilter('tag', tag)}
                  >
                    {tag}
                  </Badge>
                ))}
                {tags.length > 10 && (
                  <Badge variant="ghost" size="sm" className="opacity-60">
                    +{tags.length - 10} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Quick Filter Shortcuts */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            Quick filters:
          </span>
          <button
            onClick={() => updateFilter('category', 'QA Engineering')}
            className="text-sm text-electric-blue hover:underline transition-colors"
          >
            QA Engineering
          </button>
          <button
            onClick={() => updateFilter('category', 'Fantasy Football Analytics')}
            className="text-sm text-matrix-green hover:underline transition-colors"
          >
            Fantasy Football
          </button>
          <button
            onClick={() => updateFilter('tag', 'Testing')}
            className="text-sm text-cyber-teal hover:underline transition-colors"
          >
            Testing
          </button>
          <button
            onClick={() => updateFilter('tag', 'Automation')}
            className="text-sm text-neon-purple hover:underline transition-colors"
          >
            Automation
          </button>
        </div>
      </GlassCard>
    </div>
  );
}