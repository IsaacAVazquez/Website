"use client";

import { Badge } from "@/components/ui/Badge";
import { ModernButton } from "@/components/ui/ModernButton";

interface SearchFiltersProps {
  type: string;
  category: string;
  onTypeChange: (type: string) => void;
  onCategoryChange: (category: string) => void;
  onClearFilters: () => void;
}

export function SearchFilters({
  type,
  category,
  onTypeChange,
  onCategoryChange,
  onClearFilters
}: SearchFiltersProps) {
  
  const contentTypes = [
    { id: 'all', label: 'All Content' },
    { id: 'blog', label: 'Blog Posts' },
    { id: 'project', label: 'Projects' },
    { id: 'page', label: 'Pages' }
  ];

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'QA Engineering', label: 'QA Engineering' },
    { id: 'Fantasy Football Analytics', label: 'Fantasy Football' },
    { id: 'Software Quality', label: 'Software Quality' },
    { id: 'Software Development', label: 'Development' },
    { id: 'Testing', label: 'Testing' },
    { id: 'Analytics', label: 'Analytics' }
  ];

  const hasActiveFilters = type !== 'all' || category !== 'all';

  return (
    <div className="space-y-4 p-4 bg-slate-50/50 dark:bg-slate-800/25 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
      {/* Content Type Filter */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Content Type
        </h4>
        <div className="flex flex-wrap gap-2">
          {contentTypes.map((contentType) => (
            <button
              key={contentType.id}
              onClick={() => onTypeChange(contentType.id)}
              className={`transition-all duration-200 ${
                type === contentType.id
                  ? 'transform scale-105'
                  : 'hover:scale-105'
              }`}
            >
              <Badge
                variant={type === contentType.id ? 'electric' : 'outline'}
                size="sm"
                className="cursor-pointer"
              >
                {contentType.label}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Category
        </h4>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`transition-all duration-200 ${
                category === cat.id
                  ? 'transform scale-105'
                  : 'hover:scale-105'
              }`}
            >
              <Badge
                variant={category === cat.id ? 'matrix' : 'outline'}
                size="sm"
                className="cursor-pointer"
              >
                {cat.label}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <ModernButton
            onClick={onClearFilters}
            variant="ghost"
            size="sm"
            className="text-sm"
          >
            Clear all filters
          </ModernButton>
        </div>
      )}
    </div>
  );
}