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

    if (key !== 'q') {
      params.delete('q');
      setSearchQuery("");
    }

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
      <WarmCard hover={false} padding="lg">
        <form onSubmit={handleSearch} className="relative">
          <div className={`relative transition-all duration-300 ${
            isSearchFocused ? 'scale-[1.02]' : ''
          }`}>
            <IconSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search articles..."
              className="w-full pl-12 pr-12 py-4 bg-[var(--surface-secondary)] border-2 border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200 text-[var(--text-primary)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors"
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

      <WarmCard hover={false} padding="lg">
        <div className="space-y-6">
          <div>
            <Heading level={3} className="mb-4 text-lg text-[var(--color-primary)]">
              Categories
            </Heading>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateFilter('category', null)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  !currentCategory
                    ? 'bg-[var(--color-primary)] text-white shadow-lg'
                    : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
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
                      ? 'bg-[var(--color-warning)] text-[var(--text-primary)] shadow-lg'
                      : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-primary)] hover:border-[var(--color-warning)] hover:text-[var(--color-warning)]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {tags.length > 0 && (
            <div>
              <Heading level={3} className="mb-4 text-lg text-[var(--color-primary)]">
                Tags
              </Heading>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateFilter('tag', null)}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                    !currentTag
                      ? 'bg-[var(--color-primary)] text-white shadow-lg'
                      : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
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
                        ? 'bg-[var(--color-warning)] text-[var(--text-primary)] shadow-lg'
                        : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-primary)] hover:border-[var(--color-warning)] hover:text-[var(--color-warning)]'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {tags.length > 10 && (
                  <span className="px-3 py-1.5 text-sm text-[var(--text-secondary)] opacity-60">
                    +{tags.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </WarmCard>

      <WarmCard hover={false} padding="md">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-[var(--text-secondary)] font-medium">
            Quick filters:
          </span>
          <button
            onClick={() => updateFilter('category', 'QA Engineering')}
            className="text-sm text-[var(--color-primary)] hover:underline transition-colors"
          >
            QA Engineering
          </button>
          <button
            onClick={() => updateFilter('category', 'Fantasy Football Analytics')}
            className="text-sm text-[var(--color-warning)] hover:underline transition-colors"
          >
            Fantasy Football
          </button>
          <button
            onClick={() => updateFilter('tag', 'Testing')}
            className="text-sm text-[var(--color-primary)] hover:underline transition-colors"
          >
            Testing
          </button>
          <button
            onClick={() => updateFilter('tag', 'Automation')}
            className="text-sm text-[var(--color-success)] hover:underline transition-colors"
          >
            Automation
          </button>
        </div>
      </WarmCard>
    </div>
  );
}
