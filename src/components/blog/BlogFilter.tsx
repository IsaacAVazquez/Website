"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
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
      <WarmCard hover={false} padding="lg">
        <form onSubmit={handleSearch} className="relative">
          <div className={`relative transition-all duration-300 ${
            isSearchFocused ? 'scale-[1.02]' : ''
          }`}>
            <IconSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9C7A5F] dark:text-[#D4A88E] w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search articles..."
              className="w-full pl-12 pr-12 py-4 bg-[#FFF8F0] dark:bg-[#4A3426]/30 border-2 border-[#FFE4D6] dark:border-[#FF8E53]/30 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] transition-all duration-200 text-[#2D1B12] dark:text-[#FFE4D6]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#9C7A5F] hover:text-[#FF6B35] dark:hover:text-[#FF8E53] transition-colors"
              >
                <IconX className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="mt-4 flex justify-center">
            <ModernButton type="submit" variant="primary" size="md">
              Search Articles
            </ModernButton>
          </div>
        </form>
      </WarmCard>

      {/* Category and Tag Filters */}
      <WarmCard hover={false} padding="lg">
        <div className="space-y-6">
          {/* Categories */}
          <div>
            <Heading level={3} className="mb-4 text-lg text-[#FF6B35]">
              Categories
            </Heading>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateFilter('category', null)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  !currentCategory
                    ? 'bg-[#FF6B35] text-white shadow-warm-lg'
                    : 'bg-[#FFF8F0] dark:bg-[#4A3426]/30 text-[#4A3426] dark:text-[#D4A88E] border border-[#FFE4D6] dark:border-[#FF8E53]/30 hover:border-[#FF6B35] hover:text-[#FF6B35]'
                }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => updateFilter('category', category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    currentCategory === category
                      ? 'bg-[#F7B32B] text-[#2D1B12] shadow-warm-lg'
                      : 'bg-[#FFF8F0] dark:bg-[#4A3426]/30 text-[#4A3426] dark:text-[#D4A88E] border border-[#FFE4D6] dark:border-[#FF8E53]/30 hover:border-[#F7B32B] hover:text-[#F7B32B]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <Heading level={3} className="mb-4 text-lg text-[#FF6B35]">
                Tags
              </Heading>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateFilter('tag', null)}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                    !currentTag
                      ? 'bg-[#FF6B35] text-white shadow-warm-lg'
                      : 'bg-[#FFF8F0] dark:bg-[#4A3426]/30 text-[#4A3426] dark:text-[#D4A88E] border border-[#FFE4D6] dark:border-[#FF8E53]/30 hover:border-[#FF6B35] hover:text-[#FF6B35]'
                  }`}
                >
                  All Tags
                </button>
                {tags.slice(0, 10).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => updateFilter('tag', tag)}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                      currentTag === tag
                        ? 'bg-[#F7B32B] text-[#2D1B12] shadow-warm-lg'
                        : 'bg-[#FFF8F0] dark:bg-[#4A3426]/30 text-[#4A3426] dark:text-[#D4A88E] border border-[#FFE4D6] dark:border-[#FF8E53]/30 hover:border-[#F7B32B] hover:text-[#F7B32B]'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {tags.length > 10 && (
                  <span className="px-3 py-1.5 text-sm text-[#9C7A5F] dark:text-[#D4A88E] opacity-60">
                    +{tags.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </WarmCard>

      {/* Quick Filter Shortcuts */}
      <WarmCard hover={false} padding="md">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E] font-medium">
            Quick filters:
          </span>
          <button
            onClick={() => updateFilter('category', 'QA Engineering')}
            className="text-sm text-[#FF6B35] hover:underline transition-colors"
          >
            QA Engineering
          </button>
          <button
            onClick={() => updateFilter('category', 'Fantasy Football Analytics')}
            className="text-sm text-[#F7B32B] hover:underline transition-colors"
          >
            Fantasy Football
          </button>
          <button
            onClick={() => updateFilter('tag', 'Testing')}
            className="text-sm text-[#FF8E53] hover:underline transition-colors"
          >
            Testing
          </button>
          <button
            onClick={() => updateFilter('tag', 'Automation')}
            className="text-sm text-[#6BCF7F] hover:underline transition-colors"
          >
            Automation
          </button>
        </div>
      </WarmCard>
    </div>
  );
}
